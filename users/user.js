const { CognitoIdentityProviderClient, AdminGetUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { awsconfig } = require('../config/awsconfig');

const cognito = new CognitoIdentityProviderClient(awsconfig);

module.exports.handler = async (event) => {

    const { id } = event.pathParameters;
    console.log(id)

    try {

        const response = await cognito.send(new AdminGetUserCommand({
            UserPoolId: awsconfig.userPoolId,
            Username: id
        }));
        //console.log(response);
        let user = {
            id: response.UserAttributes.find(obj => obj.Name  === 'sub')?.Value,
            email: response.UserAttributes.find(obj => obj.Name  === 'email')?.Value,
            firstname: response.UserAttributes.find(obj => obj.Name  === 'given_name')?.Value,
            lastname: response.UserAttributes.find(obj => obj.Name  === 'family_name')?.Value,
            enabled: response.Enabled,
            status: response.UserStatus,
        }


        return {
            statusCode: 200,
            body: JSON.stringify(user)
        }

    } catch (err) {
        return {
            statusCode: 500,
            body: err.message
        }
    }
}  