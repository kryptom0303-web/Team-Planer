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

  // Daten beim Laden der Seite aus der Supabase-Datenbank abrufen
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

  // Funktion: Neuen Termin per Klick im Kalender eintragen
  const handleDateSelect = async (selectInfo) => {
    let title = prompt('Bitte Status eingeben (z.B. Max Mustermann: Home-Office)');
    
    if (title) {
      let calendarApi = selectInfo.view.calendar;
      calendarApi.unselect(); // Auswahl aufheben

      // Farbe anhand des Textes bestimmen
      let color = '#3b82f6'; // Standard: Blau (Home-Office)
      if (title.toLowerCase().includes('urlaub')) {
        color = '#eab308'; // Gelb für Urlaub
      } else if (title.toLowerCase().includes('büro')) {
        color = '#22c55e'; // Grün für Büro
      }

      const newEvent = {
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        color: color,
        all_day: selectInfo.allDay,
      };

      // In Supabase-Datenbank speichern
      const { data, error } = await supabase.from('events').insert([newEvent]).select();

      if (error) {
        alert('Fehler beim Speichern: ' + error.message);
      } else if (data) {
        setEvents([...events, data[0]]);
        window.location.reload(); // Zur Sicherheit neu laden, damit alle es sehen
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Team-Präsenz Planer</h1>
      <p>Tippe auf einen Tag oder ziehe einen Bereich, um deinen Status einzutragen.</p>

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