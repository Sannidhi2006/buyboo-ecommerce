'use strict';
require('dotenv').config();
const sequelize = require('./config/database');
(async () => {
  const columns = await sequelize.getQueryInterface().describeTable('users');
  if (!columns.is_active) await sequelize.query('ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER phone');
  if (!columns.auth_version) await sequelize.query('ALTER TABLE users ADD COLUMN auth_version INT NOT NULL DEFAULT 0 AFTER is_active');
  console.log('Phase 7 user-account migration complete.');
  await sequelize.close();
})().catch(async (error) => { console.error(error); await sequelize.close(); process.exitCode = 1; });
