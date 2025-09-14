export const getStudioImages = async (baseUrl, studioId) => {
  try {
    const response = await fetch(`${baseUrl}imagesCrud/studioImage/${studioId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.image_urls || [];
    } else {
      throw new Error(data.error || 'Failed to fetch studio images');
    }
  } catch (error) {
    console.error('Error fetching studio images:', error);
    throw error;
  }
};

export const uploadStudioImages = async (baseUrl, studioId, imageFiles) => {
  try {
    const formData = new FormData();
    
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    formData.append('entity_id', studioId);
    
    const response = await fetch(`${baseUrl}imagesCrud/studioImage/`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.results || [];
    } else {
      throw new Error(data.error || 'Failed to upload studio images');
    }
  } catch (error) {
    console.error('Error uploading studio images:', error);
    throw error;
  }
};

export const deleteStudioImage = async (baseUrl, studioId, imageName) => {
  try {
    const response = await fetch(`${baseUrl}imagesCrud/studioImage/${studioId}/${imageName}/`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.message || 'Image deleted successfully';
    } else {
      throw new Error(data.error || 'Failed to delete studio image');
    }
  } catch (error) {
    console.error('Error deleting studio image:', error);
    throw error;
  }
};

export const getStudioLogo = async (baseUrl, studioId) => {
  try {
    const response = await fetch(`${baseUrl}imagesCrud/studioIcon/${studioId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.image_urls || [];
    } else {
      throw new Error(data.error || 'Failed to fetch studio logo');
    }
  } catch (error) {
    console.error('Error fetching studio logo:', error);
    throw error;
  }
};

export const uploadStudioLogo = async (baseUrl, studioId, imageFile) => {
  try {
    const formData = new FormData();
    
    formData.append('images', imageFile);
    
    formData.append('entity_id', studioId);
    
    const response = await fetch(`${baseUrl}imagesCrud/studioIcon/`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.results || [];
    } else {
      throw new Error(data.error || 'Failed to upload studio logo');
    }
  } catch (error) {
    console.error('Error uploading studio logo:', error);
    throw error;
  }
};

export const deleteStudioLogo = async (baseUrl, studioId, logoName) => {
  try {
    const response = await fetch(`${baseUrl}imagesCrud/studioIcon/${studioId}/${logoName}/`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.message || 'Logo deleted successfully';
    } else {
      throw new Error(data.error || 'Failed to delete studio logo');
    }
  } catch (error) {
    console.error('Error deleting studio logo:', error);
    throw error;
  }
};

export const getStudioAnnouncements = async (baseUrl, studioId) => {
  try {
    const response = await fetch(`${baseUrl}imagesCrud/studioAnnouncements/${studioId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.image_urls || [];
    } else {
      throw new Error(data.error || 'Failed to fetch studio announcements');
    }
  } catch (error) {
    console.error('Error fetching studio announcements:', error);
    throw error;
  }
};

export const uploadStudioAnnouncements = async (baseUrl, studioId, imageFiles) => {
  try {
    const formData = new FormData();
    
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    formData.append('entity_id', studioId);
    
    const response = await fetch(`${baseUrl}imagesCrud/studioAnnouncements/`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.results || [];
    } else {
      throw new Error(data.error || 'Failed to upload studio announcements');
    }
  } catch (error) {
    console.error('Error uploading studio announcements:', error);
    throw error;
  }
};

export const deleteStudioAnnouncement = async (baseUrl, studioId, announcementName) => {
  try {
    const response = await fetch(`${baseUrl}imagesCrud/studioAnnouncements/${studioId}/${announcementName}/`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.message || 'Announcement deleted successfully';
    } else {
      throw new Error(data.error || 'Failed to delete studio announcement');
    }
  } catch (error) {
    console.error('Error deleting studio announcement:', error);
    throw error;
  }
};

export const StudioImageService = {
  async loadStudioImages(baseUrl, studioId) {
    return await getStudioImages(baseUrl, studioId);
  },
  
  async addStudioImages(baseUrl, studioId, files) {
    return await uploadStudioImages(baseUrl, studioId, files);
  },
  
  async removeStudioImage(baseUrl, studioId, imageName) {
    return await deleteStudioImage(baseUrl, studioId, imageName);
  },
  
  async loadStudioLogo(baseUrl, studioId) {
    return await getStudioLogo(baseUrl, studioId);
  },
  
  async updateStudioLogo(baseUrl, studioId, file) {
    return await uploadStudioLogo(baseUrl, studioId, file);
  },
  
  async removeStudioLogo(baseUrl, studioId, logoName) {
    return await deleteStudioLogo(baseUrl, studioId, logoName);
  },
  
  async loadStudioAnnouncements(baseUrl, studioId) {
    return await getStudioAnnouncements(baseUrl, studioId);
  },
  
  async addStudioAnnouncements(baseUrl, studioId, files) {
    return await uploadStudioAnnouncements(baseUrl, studioId, files);
  },
  
  async removeStudioAnnouncement(baseUrl, studioId, announcementName) {
    return await deleteStudioAnnouncement(baseUrl, studioId, announcementName);
  }
};

export default StudioImageService;
