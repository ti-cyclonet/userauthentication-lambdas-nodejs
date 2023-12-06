const { CognitoIdentityProvider } = require("@aws-sdk/client-cognito-identity-provider");
const { awsconfig } = require('../config/awsconfig');

const cognito = new CognitoIdentityProvider(awsconfig);


module.exports.handler = async (event) => {

    
    const { id } = event.pathParameters;
    console.log(id)

    const params = {
        UserPoolId: awsconfig.userPoolId,
        Username: id
    };

    try {

        await cognito.adminDeleteUser(params);
        return {
            statusCode: 200,
            body: null
        }
        
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: err.message
        }
    }
}  