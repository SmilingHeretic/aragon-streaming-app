//SPDX-License-Identifier: MIT
pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/EtherTokenConstant.sol";
import "@aragon/os/contracts/common/IsContract.sol";
import "@aragon/os/contracts/common/SafeERC20.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";

import "@aragon/apps-vault/contracts/Vault.sol";

import {ISuperfluid, IConstantFlowAgreementV1, ISuperToken} from "./SuperfluidInterfaces.sol";

contract Streaming is EtherTokenConstant, IsContract, AragonApp {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    bytes32 public constant DEPOSIT_ROLE = keccak256("DEPOSIT_ROLE");
    bytes32 public constant WITHDRAW_ROLE = keccak256("WITHDRAW_ROLE");
    bytes32 public constant WHITELIST_SUPER_TOKEN_ROLE =
        keccak256("WHITELIST_SUPER_TOKEN_ROLE");
    bytes32 public constant UPDATE_STREAM_ROLE =
        keccak256("UPDATE_STREAM_ROLE");

    string private constant ERROR_VAULT_NOT_CONTRACT = "VAULT_NOT_CONTRACT";
    string private constant ERROR_TOKEN_APPROVE_FAILED =
        "STREAMING_TOKEN_APPROVE_FAILED";
    string private constant ERROR_SUPER_TOKEN_NOT_WHITELISTED =
        "SUPER_TOKEN_NOT_WHITELISTED";

    Vault public vault;
    ISuperfluid host;
    IConstantFlowAgreementV1 cfa;
    mapping(address => bool) superTokenWhitelist;

    event StreamUpdate(
        ISuperToken superToken,
        address receiver,
        int96 newFlowRate
    );
    event Deposit(ISuperToken superToken, uint256 amount);
    event Withdrawal(ISuperToken superToken, uint256 amount);
    event SuperTokenWhitlelisted(ISuperToken superToken);

    /**
     * @notice Initialize Streaming app for Vault at `_vault` with Superfluid contracts addresses: host: `_host`, constant flow agreement: `_cfa`. Whitelist super tokens with following addresses: `_superTokenWhitelist`
     * @param _vault Address of the vault Streaming will rely on (non changeable)
     * @param _host Host smart contract of Superfluid
     * @param _cfa Constant Flow Agreement smart contract address from Superfluid
     * @param _superTokenWhitelist List of addresses of Super Tokens for streaming to whitelist
     */
    function initialize(
        Vault _vault,
        ISuperfluid _host,
        IConstantFlowAgreementV1 _cfa,
        ISuperToken[] _superTokenWhitelist
    ) external onlyInit {
        initialized();

        require(isContract(_vault), ERROR_VAULT_NOT_CONTRACT);
        vault = _vault;
        host = _host;
        cfa = _cfa;
        for (uint256 i; i < _superTokenWhitelist.length; i++) {
            superTokenWhitelist[_superTokenWhitelist[i]] = true;
        }
    }

    /**
     * @notice Deposit `@tokenAmount(superToken, amount)` from vault (where it's still a normal, not super, token) to streaming app and convert it to super token.
     * @param superToken Address of super token to deposit for streaming
     * @param amount Amount of token to deposit for streaming
     */
    function deposit(ISuperToken superToken, uint256 amount)
        external
        isWhitelisted(superToken)
        authP(DEPOSIT_ROLE, arr(uint256(superToken), amount))
    {
        // get the underlying token address from the SuperToken contract
        address underlyingToken = superToken.getUnderlyingToken();
        // transfer tokens from vault to the streaming app smart contract
        // we have to ensure that the streaming app has the role needed to call vault.transfer

        vault.transfer(underlyingToken, address(this), amount);

        // call approve for these tokens for the super token contract
        require(
            ERC20(underlyingToken).safeApprove(superToken, amount),
            ERROR_TOKEN_APPROVE_FAILED
        );

        // call upgrade of the super token contract
        superToken.upgrade(amount);

        emit Deposit(superToken, amount);
    }

    /**
     * @notice Withdraw `@tokenAmount(superToken, amount)` from streaming app to the vault and convert it back from super token to a normal token.
     * @param superToken Address of super token to withdraw
     * @param amount Amount of token to withdraw
     */
    function withdraw(ISuperToken superToken, uint256 amount)
        external
        isWhitelisted(superToken)
        authP(WITHDRAW_ROLE, arr(uint256(superToken), amount))
    {
        // get the underlying token address from the SuperToken contract
        address underlyingToken = superToken.getUnderlyingToken();
        // downgrade from Super Tokens to ERC20
        superToken.downgrade(amount);
        // Approve the tokens for the Vault (it does the actual transferring)
        require(
            ERC20(underlyingToken).safeApprove(vault, amount),
            ERROR_TOKEN_APPROVE_FAILED
        );
        // send the downgraded tokens back to the vault
        vault.deposit(underlyingToken, amount);

        emit Withdrawal(superToken, amount);
    }

    /**
     * @notice Update (or close, or create) stream of `@tokenAmount(superToken, 1)` from the streaming app to `receiver` so the flow rate of this stream becomes `newFlowRate`
     * @param superToken Address of super token to stream
     * @param receiver Receiver of the stream
     * @param newFlowRate New flow rate of the stream
     */
    function updateStream(
        ISuperToken superToken,
        address receiver,
        int96 newFlowRate
    )
        external
        isWhitelisted(superToken)
        authP(
            UPDATE_STREAM_ROLE,
            arr(uint256(superToken), uint256(receiver), uint256(newFlowRate))
        )
    {
        // we need some whitelist for superTokens. Passing here an arbitrary address could be very bad.
        _updateOutflow(superToken, receiver, newFlowRate);

        emit StreamUpdate(superToken, receiver, newFlowRate);
    }

    /**
     * @notice Whitelist super token at `superToken` so now it can be deposited for streaming and streams of this token can be created.
     * @param superToken Address of super token to whitelist
     */
    function whitelistSuperToken(ISuperToken superToken)
        external
        authP(WHITELIST_SUPER_TOKEN_ROLE, arr(uint256(superToken)))
    {
        superTokenWhitelist[superToken] = true;
        emit SuperTokenWhitlelisted(superToken);
    }

    // helpers for updating outflows
    function _updateOutflow(
        ISuperToken superToken,
        address receiver,
        int96 newFlowRate
    ) internal {
        int96 oldFlowRate = _getOutflowRate(superToken, receiver);
        // In case of an attmept to delete a non-existent outflow, we should just do nothing.
        if (oldFlowRate == int96(0) && newFlowRate == int96(0)) return;
        // update the outflow
        bytes memory txData = _getUpdateOutflowTxData(
            superToken,
            receiver,
            oldFlowRate,
            newFlowRate
        );
        host.callAgreement(cfa, txData, "0x");
    }

    function _getUpdateOutflowTxData(
        ISuperToken superToken,
        address receiver,
        int96 oldFlowRate,
        int96 newFlowRate
    ) internal view returns (bytes memory txData) {
        // Should we delete, update or create the stream?
        if (newFlowRate == int96(0)) {
            // newFlowRate is 0 but the stream exists because oldFlowRate is non-zero. We should delete this stream.
            txData = abi.encodeWithSelector(
                cfa.deleteFlow.selector,
                superToken,
                address(this),
                receiver,
                new bytes(0)
            );
        } else if (oldFlowRate != int96(0)) {
            // both old and new flow rates have non-zero values so we should just update this outflow.
            txData = abi.encodeWithSelector(
                cfa.updateFlow.selector,
                superToken,
                receiver,
                newFlowRate,
                new bytes(0)
            );
        } else {
            // oldFlowRate is zero so the stream doesn't exist but newFlowRate one is non-zero so we should create the stream.
            txData = abi.encodeWithSelector(
                cfa.createFlow.selector,
                superToken,
                receiver,
                newFlowRate,
                new bytes(0)
            );
        }
    }

    function _getOutflowRate(ISuperToken superToken, address receiver)
        internal
        view
        returns (int96 flowRate)
    {
        (, flowRate, , ) = cfa.getFlow(superToken, address(this), receiver);
    }

    // is superToken whitelisted modifier. We cannot allow to pass arbitrary addresses to our external functions
    modifier isWhitelisted(ISuperToken superToken) {
        require(
            superTokenWhitelist[superToken],
            ERROR_SUPER_TOKEN_NOT_WHITELISTED
        );
        _;
    }
}
