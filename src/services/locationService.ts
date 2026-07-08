import { supabase } from '../lib/supabase';

interface BackupLocation {
  userId: string;
  lon: number;
  lat: number;
  timestamp: string;
}

export const locationService = {
  // Sync location to Supabase cloud
  syncLocationToSupabase: async (userId: string, lon: number, lat: number): Promise<void> => {
    try {
      // PostGIS expects coordinates in a 'POINT(longitude latitude)' string format
      const pointGeoString = `POINT(${lon} ${lat})`;

      const { data, error } = await supabase
        .from('user_locations')
        .insert([
          { 
            user_id: userId, 
            coordinates: pointGeoString 
          }
        ]);

      if (error) throw error;
      console.log('[LOCATION] Synced to Supabase successfully:', data);
      
    } catch (error) {
      console.warn('[LOCATION] Network issue or sync failure. Kept in local storage.', error);
      throw error;
    }
  },

  // Save locally first to guarantee data isn't lost if offline
  saveToLocalStorage: (userId: string, lon: number, lat: number, timestamp: string): void => {
    const backupData: BackupLocation = { userId, lon, lat, timestamp };
    localStorage.setItem('last_captured_location', JSON.stringify(backupData));
    console.log('[LOCATION] Saved securely to local storage.');
  },

  // Check and sync backup location when back online
  checkAndSyncBackup: async (): Promise<void> => {
    const backup = localStorage.getItem('last_captured_location');
    if (backup) {
      try {
        const { userId, lon, lat }: BackupLocation = JSON.parse(backup);
        console.log('[LOCATION] Connection restored. Syncing cached location...');
        await locationService.syncLocationToSupabase(userId, lon, lat);
        // Clear backup after successful sync
        localStorage.removeItem('last_captured_location');
      } catch (err) {
        console.error('[LOCATION] Failed to sync backup:', err);
      }
    }
  },

  // Initialize tracking
  initTracking: () => {
    window.addEventListener('online', locationService.checkAndSyncBackup);
    
    // Initial check in case we were offline during previous sessions
    if (navigator.onLine) {
      locationService.checkAndSyncBackup();
    }
  }
};
