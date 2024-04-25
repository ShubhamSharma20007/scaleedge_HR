var mysql = require('mysql');

var con = mysql.createConnection({

    host : 'localhost',
    user : 'root',
    password : 'Shubu@123',
    database : 'scaleedge_attendance'
});

// var con = mysql.createConnection({



//     host : 'az1-ts112.a2hosting.com',

//     /*user : 'scaleedg_lead',

//     password : 'D(-W9u)bxSZg',

//     database : 'scaleedg_lead'*/user : 'scaleedg_martonline',

//     password : '~aTBK3*4K=t+',

//     database : 'scaleedg_martonline'
  
// });

// var con = mysql.createConnection({



//     host : 'localhost',

//     /*user : 'scaleedg_lead',

//     password : 'D(-W9u)bxSZg',
//     database : 'scaleedg_lead'*/user : 'scaleedg_megapower',

//     password : 'Qwe123!@#',

//     database : 'scaleedg_megapower'

     

    

// var con = mysql.createConnection({



//     host : 'az1-ts112.a2hosting.com',

//     /*user : 'scaleedg_lead',

//     password : 'D(-W9u)bxSZg',

//     database : 'scaleedg_lead'*/user : 'scaleedg_lead1',

//     password : 'Qwe123!@#',

//     database : 'scaleedg_lead1'

    

    

    

    

// });

    

// });

con.connect((err) => {
    if(err) throw err;
    console.log('Database Connected..');
});

module.exports = con;