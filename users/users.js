const { CognitoIdentityProvider } = require("@aws-sdk/client-cognito-identity-provider");
const { awsconfig } = require('../config/awsconfig');

const cognito = new CognitoIdentityProvider(awsconfig);

module.exports.handler = async (event) => {
    console.log(event);

    const params = {
        UserPoolId: awsconfig.userPoolId,
        Limit: 30,
    }

    try {
        let users = [];
        const response = await cognito.listUsers(params);
        if (response && response.Users) {
            users = response.Users.map(user => {
                if (user.Attributes) {
                    return {
                        id: user.Attributes.find(obj => obj.Name === "sub")?.Value ?? "",
                        email: user.Attributes.find(obj => obj.Name === "email")?.Value ?? "",                        
                        firstname: user.Attributes.find(obj => obj.Name === "given_name")?.Value ?? "",
                        lastname: user.Attributes.find(obj => obj.Name === "family_name")?.Value ?? "",
                        enabled: user.Enabled,
                        status: user.UserStatus,
                        creationDate: user.UserCreateDate // Add creationDate attribute
                    }
                }
            });

            // Sort users by creationDate in ascending order
            users.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
        }

        return {
            statusCode: 200,
            body: JSON.stringify(users)
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: err.message
        }
    }
}
