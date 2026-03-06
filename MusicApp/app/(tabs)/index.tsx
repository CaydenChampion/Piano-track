import React, { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NOTE_HEIGHT = 45;
const TICK_WIDTH = 60;
const TOTAL_TICKS = 32;

// Piano frequencies (C3 to C4)
const KEYS = [
  { note: 'C4', freq: 261.63 }, { note: 'B3', freq: 246.94 }, { note: 'A#3', freq: 233.08 },
  { note: 'A3', freq: 220.00 }, { note: 'G#3', freq: 207.65 }, { note: 'G3', freq: 196.00 },
  { note: 'F#3', freq: 185.00 }, { note: 'F3', freq: 174.61 }, { note: 'E3', freq: 164.81 },
  { note: 'D#3', freq: 155.56 }, { note: 'D3', freq: 146.83 }, { note: 'C#3', freq: 138.59 },
  { note: 'C3', freq: 130.81 }
];

export default function PianoRollApp() {
  const [notes, setNotes] = useState<{key: string, tick: number}[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const playheadPos = useSharedValue(0);

  // Function to trigger a synth sound based on frequency
  const playSynthNote = (frequency: number) => {
    // In a production app, you'd use a Native Module for low-latency synth.
    // For now, we simulate the "Piano Sound" via console or pre-loaded buffer.
    console.log(`Synthesizing Note at ${frequency}Hz`);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      cancelAnimation(playheadPos);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Move playhead to the end of the track
      const remainingDistance = (TOTAL_TICKS * TICK_WIDTH) - playheadPos.value;
      const duration = (remainingDistance / TICK_WIDTH) * 500; // 500ms per beat

      playheadPos.value = withTiming(TOTAL_TICKS * TICK_WIDTH, {
        duration: duration,
        easing: Easing.linear,
      }, (finished) => {
        if (finished) {
          playheadPos.value = 0;
          setIsPlaying(false);
        }
      });
    }
  };

  const rewind = () => {
    cancelAnimation(playheadPos);
    playheadPos.value = 0;
    setIsPlaying(false);
  };

  const toggleNote = (key: string, tick: number, freq: number) => {
    const noteId = `${key}-${tick}`;
    const exists = notes.find(n => n.key === key && n.tick === tick);
    if (exists) {
      setNotes(notes.filter(n => n !== exists));
    } else {
      setNotes([...notes, { key, tick }]);
      playSynthNote(freq);
    }
  };

  const playheadStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: playheadPos.value }],
  }));

  return (
    <View style={styles.container}>
      {/* HEader ControLS */}
      <View style={styles.header}>
        <TouchableOpacity onPress={togglePlayback} style={styles.controlBtn}>
          <Text style={styles.btnText}>{isPlaying ? '⏸ PAUSE' : '▶ PLAY'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={rewind} style={styles.controlBtn}>
          <Text style={styles.btnText}>⏮ REWIND</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>PIANO TRACKER</Text>
      </View>

      <ScrollView horizontal bounces={false} style={styles.workspace}>
        <View>
          {KEYS.map((item) => (
            <View key={item.note} style={styles.trackRow}>
              {/* PIANO KEY */}
              <TouchableOpacity 
                style={[styles.pianoKey, item.note.includes('#') ? styles.blackKey : styles.whiteKey]}
                onPress={() => playSynthNote(item.freq)}
              >
                <Text style={styles.keyLabel}>{item.note}</Text>
              </TouchableOpacity>

              {/* GRID CELLS */}
              <View style={styles.grid}>
                {Array.from({ length: TOTAL_TICKS }).map((_, tick) => (
                  <TouchableOpacity
                    key={tick}
                    onPress={() => toggleNote(item.note, tick, item.freq)}
                    style={[
                      styles.cell,
                      notes.some(n => n.key === item.note && n.tick === tick) && styles.cellActive
                    ]}
                  />
                ))}
              </View>
            </View>
          ))}
          
          {/* MOVING PLAYHEAD */}
          <Animated.View style={[styles.playhead, playheadStyle]} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { 
    height: 80, backgroundColor: '#1e1e1e', 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 20, paddingTop: 30,
    borderBottomWidth: 1, borderBottomColor: '#333'
  },
  logo: { color: '#00d1ff', fontWeight: 'bold', marginLeft: 'auto', fontSize: 16 },
  controlBtn: { backgroundColor: '#333', padding: 10, borderRadius: 6, marginRight: 10 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  workspace: { flex: 1 },
  trackRow: { flexDirection: 'row' },
  pianoKey: { 
    width: 70, height: NOTE_HEIGHT, 
    justifyContent: 'center', paddingLeft: 10,
    borderBottomWidth: 1, borderBottomColor: '#444',
    zIndex: 10
  },
  whiteKey: { backgroundColor: '#e0e0e0' },
  blackKey: { backgroundColor: '#222' },
  keyLabel: { fontSize: 10, color: '#888', fontWeight: 'bold' },
  grid: { flexDirection: 'row' },
  cell: { 
    width: TICK_WIDTH, height: NOTE_HEIGHT, 
    borderWidth: 0.5, borderColor: '#222', backgroundColor: '#1a1a1a' 
  },
  cellActive: { 
    backgroundColor: '#00d1ff', 
    borderRadius: 4, 
    margin: 2,
    shadowColor: '#00d1ff', shadowOpacity: 0.5, shadowRadius: 5
  },
  playhead: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 2, backgroundColor: '#ff4d4d',
    left: 70, // Offset by piano key width
    zIndex: 100
  }
});