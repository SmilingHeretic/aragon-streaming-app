//SPDX-License-Identifier: MIT
pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/EtherTokenConstant.sol";
import "@aragon/os/contracts/common/IsContract.sol";
import "@aragon/os/contracts/common/SafeERC20.sol";

import "@aragon/os/contracts/lib/math/SafeMath.sol";

import "@aragon/apps-vault/contracts/Vault.sol";


contract Streaming is EtherTokenConstant, IsContract, AragonApp {
    using SafeMath for uint256;

    // use safe math because of old version of Solidity
    // roles: similar to finance app?
    // convert to super token role
    // manage stream role

    bytes32 public constant DEPOSIT_FOR_STREAMING_ROLE = keccak256("DEPOSIT_FOR_STREAMING_ROLE");
    bytes32 public constant UPDATE_STREAMS_ROLE = keccak256("UPDATE_STREAMS_ROLE");

    string private constant ERROR_VAULT_NOT_CONTRACT = "FINANCE_VAULT_NOT_CONTRACT";

    Vault public vault;

    function initialize(Vault _vault) external onlyInit {
        initialized();

        require(isContract(_vault), ERROR_VAULT_NOT_CONTRACT);
        vault = _vault;
    }

    // function for token -> superToken conversion
    // function superTokens -> Tokens

    // function for updating a stream, triggered on "send" from UI
    // let's copy from StreamingCollateral the logic for handling cases

    // function

    // we should keep mapping of Token and SuperToken addresses somewhere. They depend on network...
    //
}