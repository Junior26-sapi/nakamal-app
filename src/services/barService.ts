import { supabase } from '../lib/supabase';
import { Bar, MenuItem, BarUpdate } from '../types';

export const barService = {
  // Get bar by manager ID
  getBarByManager: async (managerId: string) => {
    try {
      const { data, error } = await supabase
        .from('bars')
        .select('*')
        .eq('manager_id', managerId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        managerId: data.manager_id,
        tags: data.tags || [],
        businessHours: data.business_hours || {},
        statusHistory: data.status_history || [],
        pricePreview: data.price_preview,
        logoUrl: data.logo_url,
        photos: data.photos || []
      } as Bar;
    } catch (error) {
      console.error('Error fetching bar:', error);
      return null;
    }
  },

  // Update bar details
  updateBar: async (id: string, updates: Partial<Bar>) => {
    try {
      const payload: any = {};
      
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.pricePreview !== undefined) payload.price_preview = updates.pricePreview;
      if (updates.managerId !== undefined) payload.manager_id = updates.managerId;
      if (updates.lat !== undefined) payload.lat = updates.lat;
      if (updates.lng !== undefined) payload.lng = updates.lng;
      if (updates.businessHours !== undefined) payload.business_hours = updates.businessHours;
      if (updates.statusHistory !== undefined) payload.status_history = updates.statusHistory;
      if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
      if (updates.photos !== undefined) payload.photos = updates.photos;

      const { error } = await supabase
        .from('bars')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating bar:', error);
    }
  },

  // Persist businessHours JSON object directly to the 'bars' table
  updateBusinessHours: async (id: string, businessHours: any) => {
    try {
      const { error } = await supabase
        .from('bars')
        .update({ business_hours: businessHours })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating business hours in Supabase:', error);
      throw error;
    }
  },

  // Get menu for a bar
  getMenu: async (barId: string) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('bar_id', barId);

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        promotionPrice: item.promotion_price,
        imageUrl: item.image_url
      })) as MenuItem[];
    } catch (error) {
      console.error('Error fetching menu:', error);
      return [];
    }
  },

  // Save/Update full menu (simplistic approach: delete and re-insert)
  saveMenu: async (barId: string, items: MenuItem[]) => {
    try {
      // Step 1: Delete existing
      await supabase.from('menu_items').delete().eq('bar_id', barId);
      
      // Step 2: Insert new
      if (items.length > 0) {
        const payload = items.map(item => ({
          bar_id: barId,
          name: item.name,
          price: item.price,
          promotion_price: item.promotionPrice,
          description: item.description,
          image_url: item.imageUrl,
          category: item.category,
          status: item.status
        }));

        const { error } = await supabase.from('menu_items').insert(payload);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving menu:', error);
    }
  },

  // Get bar updates
  getBarUpdates: async (barId: string) => {
    try {
      const { data, error } = await supabase
        .from('bar_updates')
        .select('*')
        .eq('bar_id', barId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return (data || []).map(u => ({
        ...u,
        barId: u.bar_id,
        imageUrl: u.image_url,
        adImageUrl: u.ad_image_url,
        isApproved: u.is_approved
      })) as BarUpdate[];
    } catch (error) {
      console.error('Error fetching bar updates:', error);
      return [];
    }
  },

  // Subscribe to real-time bar changes
  subscribeToBar: (barId: string, callback: (bar: Partial<Bar>) => void) => {
    return supabase
      .channel(`bar-updates-${barId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bars',
          filter: `id=eq.${barId}`
        },
        (payload) => {
          const newData = payload.new as any;
          const updates: Partial<Bar> = {};
          
          if (newData.name) updates.name = newData.name;
          if (newData.address) updates.address = newData.address;
          if (newData.status) updates.status = newData.status;
          if (newData.category) updates.category = newData.category;
          if (newData.description) updates.description = newData.description;
          if (newData.tags) updates.tags = newData.tags;
          if (newData.business_hours) updates.businessHours = newData.business_hours;
          if (newData.status_history) updates.statusHistory = newData.status_history;
          if (newData.price_preview !== undefined) updates.pricePreview = newData.price_preview;
          if (newData.logo_url !== undefined) updates.logoUrl = newData.logo_url;
          if (newData.photos) updates.photos = newData.photos;
          if (newData.lat !== undefined) updates.lat = newData.lat;
          if (newData.lng !== undefined) updates.lng = newData.lng;
          
          callback(updates);
        }
      )
      .subscribe();
  },

  // Get bar by ID
  getBar: async (id: string): Promise<Bar | null> => {
    try {
      const { data, error } = await supabase
        .from('bars')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        managerId: data.manager_id,
        tags: data.tags || [],
        businessHours: data.business_hours || {},
        statusHistory: data.status_history || [],
        pricePreview: data.price_preview,
        logoUrl: data.logo_url,
        photos: data.photos || []
      } as Bar;
    } catch (error) {
      console.error('Error fetching bar:', error);
      return null;
    }
  },

  // Get all bars with minimal data
  getAllBars: async () => {
    try {
      const { data, error } = await supabase
        .from('bars')
        .select('*');

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        managerId: d.manager_id,
        tags: d.tags || [],
        businessHours: d.business_hours || {},
        statusHistory: d.status_history || [],
        pricePreview: d.price_preview,
        logoUrl: d.logo_url,
        photos: d.photos || []
      })) as Bar[];
    } catch (error) {
      console.error('Error fetching all bars:', error);
      return [];
    }
  }
};
