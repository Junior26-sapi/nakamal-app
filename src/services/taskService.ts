import { supabase } from '../lib/supabase';
import { Task, TaskPriority } from '../types';

export const taskService = {
  async getTasks(params: { barId?: string, supplierId?: string }): Promise<Task[]> {
    let query = supabase.from('tasks').select('*');
    
    if (params.barId) {
      query = query.eq('bar_id', params.barId);
    } else if (params.supplierId) {
      query = query.eq('supplier_id', params.supplierId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) {
      if (error) console.error('Error fetching tasks:', error);
      return [];
    }

    return data.map((t: any) => ({
      id: t.id,
      barId: t.bar_id,
      supplierId: t.supplier_id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      dueDate: t.due_date,
      assignedTo: t.assigned_to,
      createdAt: t.created_at
    }));
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        bar_id: task.barId,
        supplier_id: task.supplierId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.dueDate,
        assigned_to: task.assignedTo,
        created_at: Date.now()
      })
      .select()
      .single();

    if (error || !data) {
      if (error) console.error('Error creating task:', error);
      return null;
    }

    return {
      id: data.id,
      barId: data.bar_id,
      supplierId: data.supplier_id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      dueDate: data.due_date,
      assignedTo: data.assigned_to,
      createdAt: data.created_at
    };
  },

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'barId' | 'supplierId' | 'createdAt'>>): Promise<boolean> {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;

    const { error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      return false;
    }
    return true;
  },

  async deleteTask(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }
    return true;
  },

  subscribeToTasks(params: { barId?: string, supplierId?: string }, callback: (tasks: Task[]) => void) {
    let currentTasks: Task[] = [];
    
    const fetchAndCallback = async () => {
      currentTasks = await this.getTasks(params);
      callback(currentTasks);
    };

    fetchAndCallback();

    const channelId = params.barId ? `tasks-sync-bar-${params.barId}` : `tasks-sync-sup-${params.supplierId}`;
    const filter = params.barId ? `bar_id=eq.${params.barId}` : `supplier_id=eq.${params.supplierId}`;

    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks', 
        filter: filter 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const raw = payload.new as any;
          const newTask: Task = {
            id: raw.id,
            barId: raw.bar_id,
            supplierId: raw.supplier_id,
            title: raw.title,
            description: raw.description,
            priority: raw.priority,
            status: raw.status,
            dueDate: raw.due_date,
            assignedTo: raw.assigned_to,
            createdAt: raw.created_at
          };
          if (!currentTasks.some(t => t.id === newTask.id)) {
            currentTasks = [newTask, ...currentTasks];
            callback(currentTasks);
          }
        } else if (payload.eventType === 'UPDATE') {
          const raw = payload.new as any;
          const updatedTask: Task = {
            id: raw.id,
            barId: raw.bar_id,
            supplierId: raw.supplier_id,
            title: raw.title,
            description: raw.description,
            priority: raw.priority,
            status: raw.status,
            dueDate: raw.due_date,
            assignedTo: raw.assigned_to,
            createdAt: raw.created_at
          };
          currentTasks = currentTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
          callback(currentTasks);
        } else if (payload.eventType === 'DELETE') {
          currentTasks = currentTasks.filter(t => t.id !== payload.old.id);
          callback(currentTasks);
        }
      })
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};
