import mysql from 'mysql2/promise'

let pool

export function getPool() {
  if (!pool) {
    const required = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE']
    const missing = required.filter((key) => !process.env[key])
    if (missing.length > 0) throw new Error(`Missing database configuration: ${missing.join(', ')}`)

    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 5),
      namedPlaceholders: true,
    })
  }

  return pool
}

export async function query(sql, params = {}) {
  const [rows] = await getPool().execute(sql, params)
  return rows
}
