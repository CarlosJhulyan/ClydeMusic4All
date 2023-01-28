const { Sequelize } = require('sequelize');

const sequelize = (username, password) => {
    const connection = new Sequelize('Chinook', username, password, {
        dialect: 'mssql',
        port: 1433,
        pool: {
            max: 5,
            min: 0,
            idle: 10000,
        },
        dialectOptions: {
            options: {
                encrypt: true,
            },
        },
    });
    return connection;
}

module.exports = sequelize;
