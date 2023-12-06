const {
    AdminListGroupsForUserCommand, AuthFlowType,
    CognitoIdentityProviderClient,
    GetUserCommand, GlobalSignOutCommand, InitiateAuthCommand
} = require("@aws-sdk/client-cognito-identity-provider");
const Cryptr = require('cryptr');
const { createHmac } = require('crypto');
const { awsconfig } = require('../config/awsconfig');

const APP_CRYPT_PHRASE = 'myTotallySecretKey'

const cognito = new CognitoIdentityProviderClient(awsconfig);


module.exports.handler = async (event) => {

    try {

        const { id } = event.pathParameters;
        console.log(id)

        let roles = [];

        const listGroupsResponse = await cognito.send(new AdminListGroupsForUserCommand({
            UserPoolId: awsconfig.userPoolId,
            Username: id
        }));

        console.log('listGroupsResponse: ' + listGroupsResponse);

        if (listGroupsResponse && listGroupsResponse.Groups && listGroupsResponse.Groups.length > 0) {
            roles = listGroupsResponse.Groups?.map(obj => { if (obj.GroupName) return obj.GroupName; });
        }

        return {
            statusCode: 200,
            body: JSON.stringify(roles)
        }

    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: err.message
        }
    }
}
