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
    'Tom',
    'Baumi',
    'Schocki',
    'Marco',
    'Regine',
    'MK',
    'BH-H',
    'SC',
    'ES',
    'SB',
    'IW',
    'JB',
    'JR',
    'RP',
    'YM'
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
  
  // Neuer State für den Wochen-Sprung
  const [weekOffset, setWeekOffset] = useState(0);

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
    let calendarApiCalendar = selectInfo.view.calendar;
    letApiCalendar.unselect();

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

  // Funktion zum Löschen von Events
  const handleEventClick = async (clickInfo) => {
    if (window.confirm(`Möchtest du den Eintrag "${clickInfo.event.title}" wirklich löschen?`)) {
      const eventId = clickInfo.event.id;
      const parsedId = /^\d+$/.test(eventId) ? parseInt(eventId, 10) : eventId;

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', parsedId);

      if (error) {
        console.error('Fehler beim Löschen in Supabase:', error);
        alert('Fehler beim Löschen: ' + error.message);
      } else {
        setEvents(events.filter(e => e.id !== eventId));
        window.location.reload();
      }
    }
  };

  // Berechnet die Tage (Montag bis Freitag) für die ausgewählte Woche
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + (weekOffset * 7));
    
    const days = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Gibt den Status für einen bestimmten Mitarbeiter an einem konkreten Datum zurück
  const getCellProps = (name, date) => {
    const event = events.find(e => {
      const eDate = new Date(e.start);
      return e.title.startsWith(name) && 
             eDate.getFullYear() === date.getFullYear() &&
             eDate.getMonth() === date.getMonth() &&
             eDate.getDate() === date.getDate();
    });

    if (event) {
      let text = event.title.replace(`${name}: `, '');

      if (text.includes('Urlaub') || text.includes('Home-Office')) {
        text = text.split(' (')[0]; 
      }

      let style = { padding: '8px', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' };
      if (text.includes('Büro')) {
        style = { ...style, backgroundColor: '#dcfce7', color: '#166534' };
      } else if (text.includes('Home-Office')) {
        style = { ...style, backgroundColor: '#e0e7ff', color: '#1e3a8a' };
      } else if (text.includes('Urlaub')) {
        style = { ...style, backgroundColor: '#fef9c3', color: '#854d0e' };
      }

      return { text, style };
    }
    
    return { text: '-', style: { padding: '8px', fontSize: '0.9rem', textAlign: 'center', color: '#6b7280' } };
  };

  // Zählt die Personen im Büro für einen spezifischen Tag
  const countInOffice = (date) => {
    let count = 0;
    events.forEach(e => {
      const eDate = new Date(e.start);
      if (
        eDate.getFullYear() === date.getFullYear() &&
        eDate.getMonth() === date.getMonth() &&
        eDate.getDate() === date.getDate() &&
        e.title.includes('Büro')
      ) {
        count++;
      }
    });
    return count;
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
      <p><em>Tipp: Klicke auf einen Termin im Kalender, um diesen wieder zu löschen.</em></p>

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
          eventClick={handleEventClick}
          locale="de"
        />
      </div>

      {/* Wochenübersicht */}
      <div style={{ marginTop: '30px', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>Wochenübersicht</h2>
          <div>
            <button 
              onClick={() => setWeekOffset(prev => prev - 1)}
              style={{ padding: '6px 12px', marginRight: '8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              ← Vorherige Woche
            </button>
            <button 
              onClick={() => setWeekOffset(0)}
              style={{ padding: '6px 12px', marginRight: '8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              Aktuelle Woche
            </button>
            <button 
              onClick={() => setWeekOffset(prev => prev + 1)}
              style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              Nächste Woche →
            </button>
          </div>
        </div>
        <p style={{ marginTop: '-5px', color: '#6b7280' }}>
          Anzeige: {weekDays[0].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} – {weekDays[4].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ padding: '8px' }}>Mitarbeiter</th>
              {weekDays.map((date, index) => (
                <th key={index} style={{ padding: '8px', textAlign: 'center' }}>
                  {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'][index]}
                  <br />
                  <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#4b5563' }}>
                    {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mitarbeiterListe.map((name) => (
              <tr key={name} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>{name}</td>
                <td style={getCellProps(name, weekDays[0]).style}>{getCellProps(name, weekDays[0]).text}</td>
                <td style={getCellProps(name, weekDays[1]).style}>{getCellProps(name, weekDays[1]).text}</td>
                <td style={getCellProps(name, weekDays[2]).style}>{getCellProps(name, weekDays[2]).text}</td>
                <td style={getCellProps(name, weekDays[3]).style}>{getCellProps(name, weekDays[3]).text}</td>
                <td style={getCellProps(name, weekDays[4]).style}>{getCellProps(name, weekDays[4]).text}</td>
              </tr>
            ))}
            
            {/* Zeile: Personen im Büro */}
            <tr style={{ borderTop: '2px solid #ccc', fontWeight: 'bold' }}>
              <td style={{ padding: '8px', backgroundColor: '#f9fafb' }}>Personen im Büro</td>
              <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#dcfce7', color: '#166534' }}>{countInOffice(weekDays[0])}</td>
              <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#dcfce7', color: '#166534' }}>{countInOffice(weekDays[1])}</td>
              <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#dcfce7', color: '#166534' }}>{countInOffice(weekDays[2])}</td>
              <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#dcfce7', color: '#166534' }}>{countInOffice(weekDays[3])}</td>
              <td style={{ padding: '8px', textAlign: 'center', backgroundColor: '#dcfce7', color: '#166534' }}>{countInOffice(weekDays[4])}</td>
            </tr>
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

