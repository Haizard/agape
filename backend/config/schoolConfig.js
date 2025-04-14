/**
 * School Configuration
 *
 * This file contains global configuration related to the school.
 * Centralizing this information ensures consistency across the application.
 */

const schoolConfig = {
  name: 'St. John Vianney School Management System',
  shortName: 'SJVSMS',
  address: {
    street: 'P.O.BOX 8882',
    city: 'Moshi',
    country: 'Tanzania'
  },
  contact: {
    phone: '+255 123 456 789',
    email: 'info@agapelutheran.ac.tz',
    website: 'www.agapelutheran.ac.tz'
  },
  logo: '/assets/logo.png',
  motto: 'Education for Service',
  organization: 'Evangelical Lutheran Church in Tanzania - Northern Diocese'
};

module.exports = schoolConfig;
