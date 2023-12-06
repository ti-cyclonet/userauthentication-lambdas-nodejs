const { CognitoIdentityProvider } = require("@aws-sdk/client-cognito-identity-provider");
const { awsconfig } = require('../config/awsconfig');

const cognito = new CognitoIdentityProvider(awsconfig);

async function  addUserRoles(username, group) {
    const paramsAddGroup = {
        UserPoolId: awsconfig.userPoolId,
        Username: username,
        GroupName: group
    };

    try {
        const resp = await cognito.adminAddUserToGroup(paramsAddGroup);

    } catch (error) {
        console.log(error);
    }
}

module.exports.handler = async (event) => {


    console.log(event.body);
        const { email, password, firstname, lastname, roles } = JSON.parse(event.body);

    const params = {
        UserPoolId: awsconfig.userPoolId,
        Username: email,
        TemporaryPassword: password,
        UserAttributes: [
            {
                Name: 'email',
                Value: email
            },
            {
                Name: 'given_name',
                Value: firstname
            },
            {
                Name: 'family_name',
                Value: lastname
            }
        ]
    };

    try {

        const response = await cognito.adminCreateUser(params);
        if (response.User && response.User.Username) {
            //console.log(response.User);

            if (roles && roles.length > 0) {
                const promises = roles.map(rol => {
                    addUserRoles(response.User.Username, rol);
                });
                await Promise.all(promises);
            }

            if (response.User.UserStatus === "FORCE_CHANGE_PASSWORD") {
                const paramsSetPassword = {
                    UserPoolId: awsconfig.userPoolId,
                    Username: response.User.Username,
                    Password: password,
                    Permanent: true
                };

                try {
                    const responseSetPassword = await cognito.adminSetUserPassword(paramsSetPassword);
                    //console.log(responseSetPassword);

                } catch (error) {
                    console.error(error);
                }
            }
        }
        return {
            statusCode: 200,
            body: event.body
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: err.message
        }
    }
}  