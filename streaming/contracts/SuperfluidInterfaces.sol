//SPDX-License-Identifier: MIT
pragma solidity ^0.4.24;

// Minimal, compatible with Solidity ver 0.4.24 versions of Superfluid interfaces so they can be called from the Streaming contract.
interface ISuperfluid {
    function callAgreement(
        IConstantFlowAgreementV1 agreementClass,
        bytes callData,
        bytes userData
    )
        external
        returns (
            //cleanCtx
            bytes memory returnedData
        );
}

interface IConstantFlowAgreementV1 {
    function createFlow(
        ISuperToken token,
        address receiver,
        int96 flowRate,
        bytes ctx
    ) external returns (bytes memory newCtx);

    function updateFlow(
        ISuperToken token,
        address receiver,
        int96 flowRate,
        bytes ctx
    ) external returns (bytes memory newCtx);

    function deleteFlow(
        ISuperToken token,
        address sender,
        address receiver,
        bytes ctx
    ) external returns (bytes memory newCtx);

    function getNetFlow(ISuperToken token, address account)
        external
        view
        returns (int96 flowRate);

    function getFlow(
        ISuperToken token,
        address sender,
        address receiver
    )
        external
        view
        returns (
            uint256 timestamp,
            int96 flowRate,
            uint256 deposit,
            uint256 owedDeposit
        );
}

interface ISuperToken {
    function upgrade(uint256 amount) external;

    function getUnderlyingToken() external view returns (address tokenAddr);

    function downgrade(uint256 amount) external;
}
