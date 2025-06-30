const visitorSchema = {
  name: 'string',
  lastName: 'string',
  email: 'string',
  badgeID: 'string',
  company: 'string',
  country: 'string',
  jobTitle: 'string',
  source: 'string',
  origin: 'string',
  expoName: 'string',
  timeStamp: 'string',
  checkInTime: 'string'
};

function validateVisitor(visitor) {
  const requiredKeys = Object.keys(visitorSchema);
  for (let key of requiredKeys) {
    if (!(key in visitor)) return `Missing key: ${key}`;
    if (typeof visitor[key] !== 'string' && visitor[key] !== null) {
      return `Invalid type for key: ${key}`;
    }
  }
  return true;
}

module.exports = { visitorSchema, validateVisitor };
