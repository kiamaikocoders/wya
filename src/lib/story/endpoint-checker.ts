
export const checkEndpointAvailability = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error(`Endpoint ${url} check failed:`, error);
    return false;
  }
};
