const { CognitoIdentityProviderClient, ListGroupsCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { awsconfig } = require('../config/awsconfig');

const cognito = new CognitoIdentityProviderClient(awsconfig);

function mapGroupsToRoles(groups) {
  return groups?.map(obj => {
    //return { name: obj.GroupName, description: obj.Description };
    return obj.GroupName;
  });
}

module.exports.handler = async (event) => {

  const params = {
    UserPoolId: awsconfig.userPoolId
  }

  const command = new ListGroupsCommand(params);
  try {

    let roles = [];
    const listGroupsResponse = await cognito.send(command);
    console.log(listGroupsResponse);

    if (listGroupsResponse && listGroupsResponse.Groups && listGroupsResponse.Groups.length > 0) {
      roles = mapGroupsToRoles(listGroupsResponse.Groups);
    }

    return {
      statusCode: 200,
      body: JSON.stringify(roles)
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: err.message
    }
  }
}  