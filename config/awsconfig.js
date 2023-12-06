const awsconfig = {
    region: process.env.REGION,
    userPoolId: process.env.USERPOOLID,
    credentials: {
      accessKeyId: process.env.ACCESSKEY,
      secretAccessKey: process.env.SECRET,
      clientId: process.env.CLIENTID,
      clientSecret: process.env.CLIENTSECRET,
    }
}

module.exports = {
  awsconfig
};