import { supabase } from '../lib/supabase';
import { Product } from '../types';

export const productService = {
  // Listen for products matching a supplier or all products (global market)
  listenToProducts: (
    supplierId: string | null, 
    callback: (products: Product[]) => void
  ) => {
    let currentProducts: Product[] = [];

    const fetchProducts = async () => {
      let query = supabase.from('products').select('*');
      
      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        currentProducts = data.map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          price: d.price,
          stockLevel: d.stock_level,
          supplierId: d.supplier_id,
          barId: d.bar_id,
          imageUrl: d.image_url,
          status: d.status
        } as Product));
        callback(currentProducts);
      }
    };

    // Initial fetch
    fetchProducts();

    // Real-time subscription
    const channel = supabase
      .channel(`products-sync-${supplierId || 'global'}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const raw = payload.new as any;
          if (!supplierId || raw.supplier_id === supplierId) {
            const newProd: Product = {
              id: raw.id,
              name: raw.name,
              description: raw.description,
              price: raw.price,
              stockLevel: raw.stock_level,
              supplierId: raw.supplier_id,
              barId: raw.bar_id,
              imageUrl: raw.image_url,
              status: raw.status
            };
            if (!currentProducts.some(p => p.id === newProd.id)) {
              currentProducts = [newProd, ...currentProducts];
              callback(currentProducts);
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          const raw = payload.new as any;
          const isOurProd = !supplierId || raw.supplier_id === supplierId;
          
          if (isOurProd) {
            const updatedProd: Product = {
              id: raw.id,
              name: raw.name,
              description: raw.description,
              price: raw.price,
              stockLevel: raw.stock_level,
              supplierId: raw.supplier_id,
              barId: raw.bar_id,
              imageUrl: raw.image_url,
              status: raw.status
            };
            currentProducts = currentProducts.map(p => p.id === updatedProd.id ? updatedProd : p);
            callback(currentProducts);
          } else {
            // If it was ours but now changed supplier (unlikely) or moved bar
            currentProducts = currentProducts.filter(p => p.id !== raw.id);
            callback(currentProducts);
          }
        } else if (payload.eventType === 'DELETE') {
          currentProducts = currentProducts.filter(p => p.id !== payload.old.id);
          callback(currentProducts);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Add a product
  addProduct: async (product: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          description: product.description,
          price: product.price,
          stock_level: product.stockLevel,
          supplier_id: product.supplierId,
          bar_id: product.barId,
          image_url: product.imageUrl,
          status: product.status || 'In Stock'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      return null;
    }
  },

  // Update a product
  updateProduct: async (id: string, updates: Partial<Product>) => {
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.stockLevel !== undefined) payload.stock_level = updates.stockLevel;
      if (updates.barId !== undefined) payload.bar_id = updates.barId;
      if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
      if (updates.status !== undefined) payload.status = updates.status;
      
      payload.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating product:', error);
    }
  },

  // Delete a product
  deleteProduct: async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }
};
