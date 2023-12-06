const {
    AdminListGroupsForUserCommand, AuthFlowType,
    CognitoIdentityProviderClient,
    GetUserCommand, GlobalSignOutCommand, InitiateAuthCommand
} = require("@aws-sdk/client-cognito-identity-provider");
const Cryptr = require('cryptr');
const { awsconfig } = require('../config/awsconfig');

const cognito = new CognitoIdentityProviderClient(awsconfig);

module.exports.handler = async (event) => {

    try {

        console.log(event.body);
        const { token } = JSON.parse(event.body);

        const resp = await cognito.send(new GlobalSignOutCommand({
            AccessToken: token,
        }));

        return {
            statusCode: 200
        }

    } catch (err) {
        return {
            statusCode: 500,
            body: err.message
        }
    }
}  