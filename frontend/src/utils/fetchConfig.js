export async function fetchConfig() {
    const response = await fetch("/config.json");
    const config = await response.json();
    return config.backendAPI;
  }