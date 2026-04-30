import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { createClient } from '@supabase/supabase-js';

// Hier deine Daten aus dem Supabase-Dashboard eintragen
const SUPABASE_URL = 'https://fkiinkmzervdbocbznip.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZraWlua216ZXJ2ZGJvY2J6bmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODM3ODksImV4cCI6MjA5MzA1OTc4OX0.YvG6U8Mz7PHGGwTMDAATXFFpfTTLPmnq6F11NRLI1GQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function TeamPlanerApp() {
  const [events, setEvents] = useState([]);
  
  // Neue States für Mitarbeiter-Liste und Auswahl
  const [mitarbeiterListe] = useState([
    'Tom',
    'Baumi',
    'Schocki',
    'Marco',
    'Regine'
  ]);
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Home-Office');

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase.from('events').select('*');
      if (error) {
        console.error('Fehler beim Laden:', error);
      } else {
        setEvents(data);
      }
    };
    fetchEvents();
  }, []);

  const handleDateSelect = async (selectInfo) => {
    // Sicherstellen, dass ein Mitarbeiter ausgewählt wurde
    if (!selectedMitarbeiter) {
      alert('Bitte wähle zuerst einen Mitarbeiter aus der Liste aus!');
      return;
    }

    let title = `${selectedMitarbeiter}: ${selectedStatus}`;
    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    // Farbe anhand des Status bestimmen
    let color = '#3b82f6'; // Blau für Home-Office
    if (selectedStatus === 'Urlaub') {
      color = '#eab308'; // Gelb für Urlaub
    } else if (selectedStatus === 'Büro') {
      color = '#22c55e'; // Grün für Büro
    }

    const newEvent = {
      title,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      color: color,
      all_day: selectInfo.allDay,
    };

    const { data, error } = await supabase.from('events').insert([newEvent]).select();

    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
    } else if (data) {
      setEvents([...events, data[0]]);
      // Auswahl zurücksetzen und Seite aktualisieren
      setSelectedMitarbeiter('');
      window.location.reload(); 
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Team-Präsenz Planer</h1>
      
      {/* Auswahlbereich für den Mitarbeiter und den Status */}
      <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '450px' }}>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
            Mitarbeiter auswählen:
          </label>
          <select
            value={selectedMitarbeiter}
            onChange={(e) => setSelectedMitarbeiter(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">-- Bitte wählen --</option>
            {mitarbeiterListe.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            Status:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['Home-Office', 'Büro', 'Urlaub'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: selectedStatus === status ? 'bold' : 'normal',
                  backgroundColor: 
                    status === 'Home-Office' ? (selectedStatus === status ? '#3b82f6' : '#e0e7ff') :
                    status === 'Büro' ? (selectedStatus === status ? '#22c55e' : '#dcfce7') :
                    (selectedStatus === status ? '#eab308' : '#fef9c3'),
                  color: selectedStatus === status ? '#fff' : '#1f2937',
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p>Wähle ein Datum oder einen Zeitraum im Kalender aus, um den Eintrag mit diesen Daten zu speichern.</p>

      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          select={handleDateSelect}
          locale="de"
        />
      </div>

      <style jsx>{`
        .calendar-container {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        @media (max-width: 768px) {
          h1 {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}