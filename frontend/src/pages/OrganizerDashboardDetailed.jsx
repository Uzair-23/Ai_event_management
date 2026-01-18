import { useEffect, useState } from 'react';
import API from '../services/api';
import { socket, joinOrganizerRoom } from '../services/socket';
import { useUser } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Plus,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function OrganizerDashboardDetailed() {
  const { user, isSignedIn } = useUser();
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [liveRegs, setLiveRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const navigate = useNavigate();

  // ✅ Helper function to safely get location string
  const getLocationString = (event) => {
    if (!event) return 'N/A';
    
    // If location is an object
    if (typeof event.location === 'object' && event.location !== null) {
      const city = event.location.city || event.location.name || '';
      const state = event.location.state || '';
      return `${city}${city && state ? ', ' : ''}${state}` || 'N/A';
    }
    
    // If location is a string
    return event.location || 'N/A';
  };

  // ✅ Helper function to safely get state string
  const getStateString = (event) => {
    if (!event) return 'N/A';
    
    // If state is an object
    if (typeof event.state === 'object' && event.state !== null) {
      return event.state.name || event.state.state || 'N/A';
    }
    
    // If state is a string
    return event.state || 'N/A';
  };

  // Fetch organizer's events
  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/events?limit=1000');
        
        console.log('[DASHBOARD] Raw events:', data.events);
        
        // Filter events for current organizer
        const myEvents = data.events.filter((e) => {
          const eventOrganizerId = e.organizerId || e.organizer?._id || e.organizer;
          return String(eventOrganizerId) === String(user?.id);
        });
        
        setAllEvents(myEvents);
        setEvents(myEvents);
        
        console.log('[DASHBOARD] Loaded events:', myEvents.length);
      } catch (err) {
        console.error('Error fetching organizer events:', err);
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn && user?.id) fetchMyEvents();
  }, [user, isSignedIn]);

  // Socket for live registrations
  useEffect(() => {
    if (!user?.id) return;
    
    socket.connect();
    joinOrganizerRoom(user.id);

    socket.on('registration', (payload) => {
      setLiveRegs((s) => [payload, ...s].slice(0, 15));
      toast.success('New registration received!');
      
      // Update event seats count
      setEvents(prev => prev.map(e => 
        e._id === payload.eventId 
          ? { ...e, seatsBooked: (e.seatsBooked || 0) + 1 }
          : e
      ));
      setAllEvents(prev => prev.map(e => 
        e._id === payload.eventId 
          ? { ...e, seatsBooked: (e.seatsBooked || 0) + 1 }
          : e
      ));
    });

    return () => {
      socket.off('registration');
      socket.disconnect();
    };
  }, [user]);

  // Filter events by status
  const filterEvents = (status) => {
    setActiveTab(status);
    const now = new Date();
    
    if (status === 'all') {
      setEvents(allEvents);
    } else if (status === 'upcoming') {
      setEvents(allEvents.filter(e => new Date(e.date) > now));
    } else if (status === 'past') {
      setEvents(allEvents.filter(e => new Date(e.date) < now));
    } else if (status === 'ongoing') {
      const today = new Date().toDateString();
      setEvents(allEvents.filter(e => new Date(e.date).toDateString() === today));
    }
  };

  // Get event status
  const getEventStatus = (eventDate) => {
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    const today = new Date().toDateString();
    
    if (eventDateTime.toDateString() === today) {
      return { status: 'ongoing', color: 'bg-blue-500', text: 'Ongoing' };
    } else if (eventDateTime > now) {
      return { status: 'upcoming', color: 'bg-green-500', text: 'Upcoming' };
    } else {
      return { status: 'past', color: 'bg-gray-500', text: 'Past' };
    }
  };

  // Delete event
  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await API.delete(`/events/${eventId}`);
      setEvents(prev => prev.filter(e => e._id !== eventId));
      setAllEvents(prev => prev.filter(e => e._id !== eventId));
      toast.success('Event deleted successfully');
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  // Fetch attendees for an event
  const fetchAttendees = async (eventId) => {
    try {
      setLoadingAttendees(true);
      const { data } = await API.get(`/events/${eventId}/attendees`);
      setAttendees(data.attendees || data || []);
      setSelectedEvent(eventId);
    } catch (err) {
      console.error('Error fetching attendees:', err);
      toast.error('Failed to load attendees');
      setAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  };

  // Export attendees to CSV
  const exportAttendees = (event) => {
    if (!attendees.length) {
      toast.error('No attendees to export');
      return;
    }

    const csv = [
      ['Name', 'Email', 'Ticket ID', 'Registration Date'],
      ...attendees.map(a => [
        a.userName || a.name || 'N/A',
        a.userEmail || a.email || 'N/A',
        a.ticketId || a._id,
        a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}-attendees.csv`;
    a.click();
    toast.success('Attendees exported successfully');
  };

  // Calculate statistics
  const stats = {
    totalEvents: allEvents.length,
    upcomingEvents: allEvents.filter(e => new Date(e.date) > new Date()).length,
    totalAttendees: allEvents.reduce((sum, e) => sum + (e.seatsBooked || 0), 0),
    totalCapacity: allEvents.reduce((sum, e) => sum + (e.totalSeats || 0), 0),
    averageOccupancy: allEvents.length > 0 
      ? Math.round((allEvents.reduce((sum, e) => sum + ((e.seatsBooked || 0) / (e.totalSeats || 1) * 100), 0) / allEvents.length))
      : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Organizer Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Manage your events and track performance</p>
          </div>
          <Button 
            onClick={() => navigate('/create')} 
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Event
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass glass-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Events</p>
                <p className="text-3xl font-bold mt-1">{stats.totalEvents}</p>
              </div>
              <div className="bg-primary/20 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="glass glass-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Upcoming Events</p>
                <p className="text-3xl font-bold mt-1">{stats.upcomingEvents}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="glass glass-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Attendees</p>
                <p className="text-3xl font-bold mt-1">{stats.totalAttendees}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="glass glass-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Occupancy</p>
                <p className="text-3xl font-bold mt-1">{stats.averageOccupancy}%</p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={filterEvents} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8 bg-white/5">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          {/* Events List */}
          <TabsContent value={activeTab} className="space-y-6">
            {events.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl">
                <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No events found</p>
                <p className="text-gray-500 text-sm mb-4">
                  {activeTab === 'all' 
                    ? "You haven't created any events yet" 
                    : `No ${activeTab} events`}
                </p>
                {activeTab === 'all' && (
                  <Button onClick={() => navigate('/create')} className="mt-4">
                    Create Your First Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {events.map((event) => {
                  const percent = Math.round((event.seatsBooked / event.totalSeats) * 100) || 0;
                  const statusInfo = getEventStatus(event.date);
                  const isExpanded = selectedEvent === event._id;
                  
                  // ✅ Safely extract location and state
                  const locationStr = getLocationString(event);
                  const stateStr = getStateString(event);

                  return (
                    <div 
                      key={event._id} 
                      className="glass glass-border rounded-xl p-6 hover:border-primary/50 transition-all"
                    >
                      {/* Event Header */}
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <h3 className="text-2xl font-bold">{event.title}</h3>
                            <Badge className={`${statusInfo.color} text-white border-0`}>
                              {statusInfo.text}
                            </Badge>
                            {event.isOnline && (
                              <Badge variant="outline" className="border-blue-500 text-blue-500">
                                Virtual
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(event.date), 'PPP')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {event.time || 'TBD'}
                            </div>
                            {!event.isOnline && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {/* ✅ FIXED: Render strings, not objects */}
                                {locationStr}{stateStr !== 'N/A' && locationStr !== 'N/A' ? `, ${stateStr}` : stateStr}
                              </div>
                            )}
                          </div>

                          {event.category && (
                            <Badge variant="secondary" className="mt-3">
                              {event.category}
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/events/${event._id}`)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/edit-event/${event._id}`)}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(event._id)}
                            className="gap-2 text-red-500 hover:text-red-600 hover:border-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Event Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Registrations</span>
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-2xl font-bold">{event.seatsBooked || 0}</p>
                          <p className="text-xs text-gray-500">of {event.totalSeats} total</p>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Occupancy</span>
                            <BarChart3 className="h-4 w-4 text-green-500" />
                          </div>
                          <p className="text-2xl font-bold">{percent}%</p>
                          <Progress value={percent} className="h-2 mt-2" />
                        </div>

                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Available Seats</span>
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          </div>
                          <p className="text-2xl font-bold">
                            {event.totalSeats - (event.seatsBooked || 0)}
                          </p>
                          <p className="text-xs text-gray-500">seats remaining</p>
                        </div>
                      </div>

                      {/* Attendees Section */}
                      <div className="border-t border-white/10 pt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => isExpanded ? setSelectedEvent(null) : fetchAttendees(event._id)}
                          className="w-full justify-between"
                        >
                          <span>View Attendees ({event.seatsBooked || 0})</span>
                          <span>{isExpanded ? '▲' : '▼'}</span>
                        </Button>

                        {isExpanded && (
                          <div className="mt-4 space-y-3">
                            {loadingAttendees ? (
                              <p className="text-center text-gray-400 py-4">Loading attendees...</p>
                            ) : attendees.length > 0 ? (
                              <>
                                <div className="flex justify-end mb-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportAttendees(event)}
                                    className="gap-2"
                                  >
                                    <Download className="h-4 w-4" />
                                    Export CSV
                                  </Button>
                                </div>
                                <div className="max-h-64 overflow-y-auto space-y-2">
                                  {attendees.map((attendee, idx) => (
                                    <div 
                                      key={idx} 
                                      className="bg-white/5 rounded-lg p-3 flex justify-between items-center"
                                    >
                                      <div>
                                        <p className="font-medium">
                                          {attendee.userName || attendee.name || 'Anonymous'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {attendee.userEmail || attendee.email || 'No email'}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-gray-400">
                                          Ticket: {attendee.ticketId || attendee._id?.slice(-6)}
                                        </p>
                                        {attendee.createdAt && (
                                          <p className="text-xs text-gray-500">
                                            {format(new Date(attendee.createdAt), 'MMM dd, yyyy')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className="text-center text-gray-400 py-4">No attendees yet</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Live Activity Feed */}
        {liveRegs.length > 0 && (
          <div className="glass glass-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Live Registration Activity
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {liveRegs.map((reg, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2"
                >
                  <div>
                    <span className="font-medium text-white">New Registration!</span>
                    <p className="text-sm text-gray-400">
                      Ticket: {reg.ticketId} • Event: {reg.eventTitle || 'Event'}
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    Just now
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}