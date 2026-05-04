import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function TeamPlanerApp() {
  const [events, setEvents] = useState([]);
  
  const [mitarbeiterListe] = useState([
    'Anna',
    'Ben',
    'Christian',
    'Sarah',
    'David'
  ]);

  // Mitarbeiter-Auswahl bleibt gespeichert
  const [selectedMitarbeiter, setSelectedMitarbeiter] = useState(() => {
    return localStorage.getItem('selectedMitarbeiter') || '';
  });

  // Status-Auswahl bleibt gespeichert
  const [selectedStatus, setSelectedStatus] = useState(() => {
    return localStorage.getItem('selectedStatus') || 'Home-Office';
  });

  // Arbeitszeit-Auswahl
  const [selectedZeit, setSelectedZeit] = useState('bis 16:00 Uhr');

  useEffect(() => {
    if (selectedMitarbeiter) {
      localStorage.setItem('selectedMitarbeiter', selectedMitarbeiter);
    } else {
      localStorage.removeItem('selectedMitarbeiter');
    }
  }, [selectedMitarbeiter]);

  useEffect(() => {
    localStorage.setItem('selectedStatus', selectedStatus);
  }, [selectedStatus]);

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
    if (!selectedMitarbeiter) {
      alert('Bitte wähle zuerst einen Mitarbeiter aus der Liste aus!');
      return;
    }

    let title = `${selectedMitarbeiter}: ${selectedStatus} (${selectedZeit})`;
    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

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
      window.location.reload(); 
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Team-Präsenz Planer</h1>
      
      {/* Auswahlbereich */}
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
            Arbeitszeit:
          </label>
          <select
            value={selectedZeit}
            onChange={(e) => setSelectedZeit(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="bis 16:00 Uhr">bis 16:00 Uhr</option>
            <option value="Verkürzt (früher heim)">Verkürzt (früher heim)</option>
          </select>
        </div>
      </div>

      <p>Wähle ein Datum oder einen Zeitraum im Kalender aus, um den Eintrag mit diesen Daten zu speichern.</p>

      {/* Kalender */}
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

      {/* Wochenübersicht */}
      <div style={{ marginTop: '30px', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>Wochenübersicht (Aktuelle Woche)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px' }}>Mitarbeiter</th>
              <th style={{ padding: '8px' }}>Montag</th>
              <th style={{ padding: '8px' }}>Dienstag</th>
              <th style={{ padding: '8px' }}>Mittwoch</th>
              <th style={{ padding: '8px' }}>Donnerstag</th>
              <th style={{ padding: '8px' }}>Freitag</th>
            </tr>
          </thead>
          <tbody>
            {mitarbeiterListe.map((name) => (
              <tr key={name} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>{name}</td>
                <td style={{ padding: '8px' }}>-</td>
                <td style={{ padding: '8px' }}>-</td>
                <td style={{ padding: '8px' }}>-</td>
                <td style={{ padding: '8px' }}>-</td>
                <td style={{ padding: '8px' }}>-</td>
              </tr>
            ))}
          </tbody>
        </table>
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

