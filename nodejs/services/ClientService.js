exports.getClientDetails = (key, clientApiKey) => {
    return new Promise((resolve, reject) => {
        if(key == clientApiKey){
            resolve(true);
        }else{
            reject(false);
        }
    });
}