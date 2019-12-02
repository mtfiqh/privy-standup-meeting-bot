module.exports = {
    database : function(){                     
        var admin = require("firebase-admin");
        var databaseURL = process.env.databaseURL
        var serviceAccount = require("../credentials/firebase.json");

        admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
        });
 
        return admin.firestore();
    },
    admin:function(){
        let admin = require('firebase-admin');
        return admin;
    }
     
};
