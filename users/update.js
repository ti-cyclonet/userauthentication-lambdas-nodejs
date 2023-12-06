const { CognitoIdentityProvider, ListGroupsCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { awsconfig } = require('../config/awsconfig');

const cognito = new CognitoIdentityProvider(awsconfig);

async function getAllRoles() {
    const params = {
        UserPoolId: awsconfig.userPoolId
    }

    const command = new ListGroupsCommand(params);
    try {

        let roles = [];
        const listGroupsResponse = await cognito.send(command);
        //console.log(listGroupsResponse);

        if (listGroupsResponse && listGroupsResponse.Groups && listGroupsResponse.Groups.length > 0) {
            roles = mapGroupsToRoles(listGroupsResponse.Groups);
        }

        //console.log(roles);
        return roles

    } catch (err) {
        console.error(err);
        return []
    }
}

function mapGroupsToRoles(groups) {
    return groups?.map(obj => {
        return obj.GroupName;
    });
}

async function removeUserRoles(username, group) {
    return new Promise(async (resolve, reject) => {

        const paramsRemoveUserFromGroup = {
            UserPoolId: awsconfig.userPoolId,
            Username: username,
            GroupName: group
        };

        try {
            console.log("REMOVE {" + username + "," + group + "}");
            const cognitoUser = await cognito.adminRemoveUserFromGroup(paramsRemoveUserFromGroup);
            console.log(cognitoUser);
            resolve();

        } catch (error) {
            console.log(error);
            //reject(new Error("No se pudo eliminar el rol"));
            reject();
        }

    });
}

async function addUserRoles(username, group) {
    return new Promise(async (resolve, reject) => {

        const paramsAddGroup = {
            UserPoolId: awsconfig.userPoolId,
            Username: username,
            GroupName: group
        };

        try {
            console.log("ADD {" + username + "," + group + "}");
            const cognitoUser = await cognito.adminAddUserToGroup(paramsAddGroup);
            console.log(`add group to user result : ${JSON.stringify(cognitoUser)} `);

            resolve();

        } catch (error) {
            console.log(error);
            //reject(new Error("No se pudo agregar el rol"));
            reject();
        }

    });
}

module.exports.handler = async (event) => {


    //console.log(event.body);
    const { email, user } = JSON.parse(event.body);

    const id = email;
    const roles = user.roles;

    //console.log(JSON.stringify(user));
    //console.log(JSON.stringify(roles));

    const params = {
        UserPoolId: awsconfig.userPoolId,
        Username: id,
        UserAttributes: [
            {
                Name: 'given_name',
                Value: user.firstname
            },
            {
                Name: 'family_name',
                Value: user.lastname
            }
        ]
    };

    try {

        const response = await cognito.adminUpdateUserAttributes(params);
        if (response) {
            //console.log(response);

            const promisesRemove = []

            let allRoles = await getAllRoles();
            console.log(allRoles);

            if (allRoles && allRoles.length > 0) {
                console.log("en el loop para removeUserRoles");
                const promisesRemove = allRoles.map(rol => removeUserRoles(id, rol));
                console.log(promisesRemove);
                console.log(JSON.stringify(promisesRemove));
                await Promise.all(promisesRemove);
                console.log("Termina loop para removeUserRoles");
            }

            if (roles && roles.length > 0) {
                console.log("en el loop para addUserRoles");
                const promisesAdd = roles.map(rol => addUserRoles(id, rol));
                console.log(promisesAdd);
                console.log(JSON.stringify(promisesAdd));
                await Promise.all(promisesAdd);
                console.log("Termina loop para addUserRoles");
            }

            if (user.password && user.password.length > 0) {
                try {
                    const paramsSetPassword = {
                        UserPoolId: awsconfig.userPoolId,
                        Username: email,
                        Password: user.password,
                        Permanent: true
                    };
                    const responseSetPassword = await cognito.adminSetUserPassword(paramsSetPassword);
                    console.log(responseSetPassword);

                } catch (error) {
                    console.log(error);
                }
            }

            //Se ejecutan las acciones de eliminacion y adicion de roles de manera secuencial

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