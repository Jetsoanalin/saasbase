const getClientDetails = require('../services/ClientService');


exports.clientApiKeyValidation = async (req, res, next) => {

    let clientApiKey = req.get('api_key');

    if (!clientApiKey) {
        return res.status(400).send({
            status: false,
            message: "Missing Api Key"
        })
    }

    try {
        let clientDetails = await getClientDetails.getClientDetails(process.env.apikey, clientApiKey);
        if (clientDetails) {
            next();
        }
    } catch (e) {
        return res.status(400).send({
            status: false,
            message: "Invalid Api Key"
        })
    }

}

exports.sessionauth = async (req, res, next) => {

    try {
        if (req.session.user) {
            next();
          } else {
            res.status(401).send('Authrization failed! Please login');
          }
    } catch (e) {
        return res.status(400).send({
            status: false,
            message: "Authrization failed!"
        })
    }

}