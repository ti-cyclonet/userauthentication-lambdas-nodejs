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
const cryptr = new Cryptr(APP_CRYPT_PHRASE);

function getSecretHash(username) {
    const message = username + awsconfig.credentials.clientId;
    const key = awsconfig.credentials.clientSecret;
    let hash = createHmac('sha256', key).update(message).digest('base64');
    console.log(hash);
    return hash
}

async function getUserRoles(username) {
    console.log('roles');
    const listGroupsResponse = await cognito.send(new AdminListGroupsForUserCommand({
        UserPoolId: awsconfig.userPoolId,
        Username: username
    }));
    if (listGroupsResponse && listGroupsResponse.Groups && listGroupsResponse.Groups.length > 0) {
        return listGroupsResponse.Groups?.map(obj => { if (obj.GroupName) return obj.GroupName; });
    }
    return [];
}

module.exports.handler = async (event) => {

    try {

        console.log(event);
        const { username, password } = JSON.parse(event.body);

        //const passcrypt = cryptr.encrypt(password) // se debe quitar cuando se reciba el verdadero password encriptado
        //const decryptPswd = cryptr.decrypt(passcrypt);
        const decryptPswd = cryptr.decrypt(password);
        const resp = await cognito.send(new InitiateAuthCommand({
            ClientId: awsconfig.credentials.clientId,
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: decryptPswd,
                //SECRET_HASH: getSecretHash(username)
            }

        }));

        console.log('InitiateAuthCommand: ' + resp);

        // Obtener información del usuario
        const getUserResponse = await cognito.send(new GetUserCommand({
            AccessToken: resp.AuthenticationResult?.AccessToken
        }));

        console.log(getUserResponse);
        //console.log(getUserResponse.UserAttributes);

        let _sessionUser = null;
        if (getUserResponse && getUserResponse.UserAttributes) {

            let roles = []

            try {
                roles = await getUserRoles(
                    getUserResponse.UserAttributes?.find(obj => obj.Name === "sub")?.Value ?? ""
                );
            } catch (error) {

            }
            console.log(roles);

            _sessionUser = {
                user: {
                    id: getUserResponse.UserAttributes?.find(obj => obj.Name === "sub")?.Value ?? "",
                    email: getUserResponse.UserAttributes?.find(obj => obj.Name === "email")?.Value ?? "",
                    phonenumber: getUserResponse.UserAttributes?.find(obj => obj.Name === "phone_number")?.Value ?? "",
                    firstname: getUserResponse.UserAttributes?.find(obj => obj.Name === "given_name")?.Value ?? "",
                    lastname: getUserResponse.UserAttributes?.find(obj => obj.Name === "family_name")?.Value ?? "",
                    roles: roles,
                },
                loged: true,
                sessionInfo: resp.AuthenticationResult
            };

            return {
                statusCode: 200,
                body: JSON.stringify(_sessionUser)
            }

        } else {
            return {
                statusCode: 400,
                body: 'Mensaje de error ****'
            }
        }

    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: err.message
        }
    }
}  