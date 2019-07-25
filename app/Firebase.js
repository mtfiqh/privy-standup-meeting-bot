module.exports = {
    database : function(){                     
        var admin = require("firebase-admin");

        var serviceAccount = require("../credentials/firebase.json");

        admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://privy-bot-4930d.firebaseio.com"
        });

        return admin.firestore()
    },
    admin:function(){
        let admin = require('firebase-admin');
        return admin
    }
     
};