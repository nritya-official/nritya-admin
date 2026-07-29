export const darkThemeStyles = {
    container: {
      backgroundColor: '#333',
      color: '#fff',
      padding: '20px',
    },
    loginContainer: {
      backgroundColor: '#444',
      color: '#fff',
      padding: '20px',
    },
    toggleButton: {
      margin: '10px',
    },
  };
  
  export const lightThemeStyles = {
    container: {
      backgroundColor: '#fff',
      color: '#333',
      padding: '20px',
    },
    loginContainer: {
      backgroundColor: '#fff',
      color: '#333',
      padding: '20px',
    },
    toggleButton: {
      margin: '10px',
    },
  };

  export const STATUSES = {
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under Review",
    REVIEWED: "Reviewed",
    VERIFIED: "Verified",
    VERIFICATION_FAILED: "Verification Failed",
};

export const COLLECTIONS = {
  USER: "User",
  USER_KYC:"UserKyc",
  ADMIN:"Admin",
  REVIEWS: "Reviews",
  TRANSACTIONS: "Transactions",
  STUDIO: "Studio",
  INSTRUCTORS: "Instructors",
  FREE_TRIAL_BOOKINGS:"FreeTrialBookings",
  WORKSHOPS: 'Workshops',
  OPEN_CLASSES: 'OpenClasses',
  COURSES: 'Courses',
  BOOKINGS: 'Bookings',
}

export const STORAGES ={
  STUDIOIMAGES:'StudioImages',
  STUDIOICON:'StudioIcon',
  STUDIOANNOUNCEMENTS :'StudioAnnouncements',
  USERIMAGE:'UserImage',
  INSTRUCTORIMAGES: 'InstructorImages',
  WORKSHOPICON :"WorkshopIcon",
  WORKSHOPIMAGES :"WorkshopImages",
  OPENCLASSICON :"OpenClassIcon",
  COURSEICON :"CourseIcon",
  CREATORS_KYC_DOCUMENTS :"CreatorKycDocuments"
}

export const SEARCH_FILTERS ={
  DANCEFORMS:'danceforms',
  DISTANCES:'distances',
}

export const BASEURL_DEV = "http://127.0.0.1:8000/"
export const BASEURL_PROD= "https://nrityaserver-2b241e0a97e5.herokuapp.com/"

// Server picked by the mode toggle. Shared so a revenue URL opened on its own
// resolves to the same host the workshop list was read from.
export const SERVERS = {
  PRODUCTION: "https://djserver-production-ffe37b1b53b5.herokuapp.com/",
  STAGING: "https://nrityaserver-2b241e0a97e5.herokuapp.com/",
}

export const DEFAULT_SERVER_MODE = "PRODUCTION"
