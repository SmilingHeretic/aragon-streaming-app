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

    bytes32 public constant DEPOSIT_FOR_STREAMING_ROLE =
        keccak256("DEPOSIT_FOR_STREAMING_ROLE");
    bytes32 public constant UPDATE_STREAM_ROLE =
        keccak256("UPDATE_STREAM_ROLE");

    string private constant ERROR_VAULT_NOT_CONTRACT = "VAULT_NOT_CONTRACT";

    Vault public vault;
    ISuperfluid host;
    IConstantFlowAgreementV1 cfa;

    function initialize(
        Vault _vault,
        ISuperfluid _host,
        IConstantFlowAgreementV1 _cfa
    ) external onlyInit {
        initialized();

        require(isContract(_vault), ERROR_VAULT_NOT_CONTRACT);
        vault = _vault;
        host = _host;
        cfa = _cfa;
    }

    // function for token -> superToken conversion
    // function superTokens -> Tokens

    // function for updating a stream, triggered on "send" from UI
    // let's copy from StreamingCollateral the logic for handling cases
    function updateStream(
        ISuperToken superToken,
        address receiver,
        int96 newFlowRate
    )
        external
        authP(
            UPDATE_STREAM_ROLE,
            arr(uint256(superToken), uint256(receiver), uint256(newFlowRate))
        )
    {
        // we need some whitelist for superTokens. Passing here an arbitrary address could be very bad. Maybe we can
        _updateOutflow(superToken, receiver, newFlowRate);
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
}
