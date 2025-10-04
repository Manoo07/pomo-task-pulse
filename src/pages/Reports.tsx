import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Task, Session } from '@/types/pomodoro';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, BarChart3, Target } from 'lucide-react';
import { useState } from 'react';

const Reports = () => {
  const [tasks] = useLocalStorage<Task[]>('pomodoro-tasks', []);
  const [sessions] = useLocalStorage<Session[]>('pomodoro-sessions', []);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  const today = new Date().toISOString().split('T')[0];
  
  const todaySessions = sessions.filter(s => 
    s.mode === 'pomodoro' && 
    s.completed && 
    s.startedAt?.startsWith(today)
  );
  
  const todayTasks = tasks.filter(t => 
    t.completed && 
    t.updatedAt?.startsWith(today)
  );
  
  const allSessions = sessions.filter(s => s.mode === 'pomodoro' && s.completed);
  
  const todayPomodoros = todaySessions.length;
  const todayHours = (todaySessions.reduce((sum, s) => sum + s.seconds, 0) / 3600).toFixed(1);
  const todayTasksCompleted = todayTasks.length;
  
  const totalPomodoros = allSessions.length;
  const totalHours = (allSessions.reduce((sum, s) => sum + s.seconds, 0) / 3600).toFixed(1);
  const daysActive = new Set(allSessions.map(s => s.startedAt?.split('T')[0])).size;

  const handleExportJSON = () => {
    const data = {
      total_hours: parseFloat(totalHours),
      sessions: sessions.map(s => ({
        id: s.id,
        task_id: s.taskId,
        mode: s.mode,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        seconds: s.seconds,
        completed: s.completed
      })),
      tasks: tasks.map(t => ({
        id: t.id,
        name: t.title,
        track_id: t.trackId,
        priority: t.priority,
        estimated_pomodoros: t.estimatedPomodoros,
        completed_pomodoros: t.completedPomodoros,
        status: t.status,
        created_at: t.createdAt
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodoro-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Task', 'Track', 'Priority', 'Pomodoros', 'Minutes', 'Status'];
    const rows = sessions
      .filter(s => s.mode === 'pomodoro' && s.completed)
      .map(s => {
        const task = tasks.find(t => t.id === s.taskId);
        return [
          s.startedAt?.split('T')[0] || '',
          task?.title || '(no task)',
          task?.trackId || 'Uncategorized',
          task?.priority || 'none',
          '1',
          Math.round(s.seconds / 60).toString(),
          task?.status || ''
        ].join(',');
      });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodoro-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🍅</span>
            </div>
            <h1 className="text-xl font-bold text-white">Pomofocus</h1>
          </div>
          <nav className="flex gap-2">
            <Button variant="ghost" className="text-white/90" onClick={() => window.location.href = '/'}>
              Timer
            </Button>
            <Button variant="default" className="bg-white/20 text-white hover:bg-white/30">
              Reports
            </Button>
            <Button variant="ghost" className="text-white/90" onClick={() => window.location.href = '/settings'}>
              Settings
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Today's Progress */}
        <Card className="bg-card/50 border-white/10 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Today's Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold text-white mb-2">{todayPomodoros}</div>
              <div className="text-white/70">Pomodoros Completed</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold text-white mb-2">{todayHours}</div>
              <div className="text-white/70">Hours Focused</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold text-white mb-2">{todayTasksCompleted}</div>
              <div className="text-white/70">Tasks Completed</div>
            </div>
          </div>
        </Card>

        {/* All Time Stats */}
        <Card className="bg-card/50 border-white/10 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">All Time Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold text-white mb-2">{totalPomodoros}</div>
              <div className="text-white/70">Total Pomodoros</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold text-white mb-2">{totalHours}</div>
              <div className="text-white/70">Total Hours</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-5xl font-bold text-white mb-2">{daysActive}</div>
              <div className="text-white/70">Days Active</div>
            </div>
          </div>
        </Card>

        {/* Export Data */}
        <Card className="bg-card/50 border-white/10 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Export Data</h2>
          <p className="text-white/70 mb-6">Export your Pomodoro data for analysis or backup</p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="text-white/90 text-sm mb-2 block">From:</label>
              <Input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm mb-2 block">To:</label>
              <Input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleExportJSON}
              className="bg-white text-primary hover:bg-white/90"
            >
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button 
              onClick={handleExportCSV}
              className="bg-white text-primary hover:bg-white/90"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Target className="mr-2 h-4 w-4" />
              View 10K Hours Tracker
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
