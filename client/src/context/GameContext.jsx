import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import socket from '../socket';

// ── Persistent identity ───────────────────────────────────────────────────────
function getOrCreatePlayerId() {
  let id = localStorage.getItem('objection_player_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('objection_player_id', id);
  }
  return id;
}

function getStoredName() {
  return localStorage.getItem('objection_player_name') || '';
}

function storeName(name) {
  localStorage.setItem('objection_player_name', name);
}

// ── State shape ───────────────────────────────────────────────────────────────
const initialState = {
  screen: 'landing', // landing | waiting | playing | round-end
  playerId: getOrCreatePlayerId(),
  playerName: getStoredName(),
  roomCode: null,
  roomState: null,  // full room state from server
  error: null,
  connected: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'SET_NAME':
      storeName(action.payload);
      return { ...state, playerName: action.payload };
    case 'ROOM_CREATED':
      return { ...state, roomCode: action.payload.roomCode, screen: 'waiting', error: null };
    case 'ROOM_JOINED':
      return { ...state, roomCode: action.payload.roomCode, screen: 'waiting', error: null };
    case 'ROOM_UPDATED': {
      const r = action.payload;
      let screen = state.screen;
      if (r.phase === 'waiting') screen = 'waiting';
      else if (r.phase === 'playing') screen = 'playing';
      else if (r.phase === 'round-end') screen = 'round-end';
      return { ...state, roomState: r, screen, error: null };
    }
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LEAVE_ROOM':
      return { ...state, roomCode: null, roomState: null, screen: 'landing', error: null };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Socket lifecycle
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
      // Auto-rejoin if we have a stored room (reconnection after drop)
      const stored = localStorage.getItem('objection_room_code');
      const storedName = localStorage.getItem('objection_player_name');
      const storedId = localStorage.getItem('objection_player_id');
      if (stored && storedName && storedId) {
        socket.emit('join-room', { code: stored, name: storedName, playerId: storedId });
      }
    });
    socket.on('disconnect', () => dispatch({ type: 'SET_CONNECTED', payload: false }));

    socket.on('room-created', (data) => {
      localStorage.setItem('objection_room_code', data.roomCode);
      dispatch({ type: 'ROOM_CREATED', payload: data });
    });
    socket.on('room-joined', (data) => {
      localStorage.setItem('objection_room_code', data.roomCode);
      dispatch({ type: 'ROOM_JOINED', payload: data });
    });
    socket.on('room-updated', (data) => dispatch({ type: 'ROOM_UPDATED', payload: data }));
    socket.on('error', ({ message }) => dispatch({ type: 'SET_ERROR', payload: message }));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('room-updated');
      socket.off('error');
      socket.disconnect();
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const setName = useCallback((name) => {
    dispatch({ type: 'SET_NAME', payload: name });
  }, []);

  const createRoom = useCallback((name) => {
    dispatch({ type: 'SET_NAME', payload: name });
    socket.emit('create-room', { name, playerId: state.playerId });
  }, [state.playerId]);

  const joinRoom = useCallback((code, name) => {
    dispatch({ type: 'SET_NAME', payload: name });
    socket.emit('join-room', { code, name, playerId: state.playerId });
  }, [state.playerId]);

  const startGame = useCallback((timerSec) => {
    socket.emit('start-game', { code: state.roomCode, timerSec });
  }, [state.roomCode]);

  const setTimerConfig = useCallback((durationSec) => {
    socket.emit('set-timer-config', { code: state.roomCode, durationSec });
  }, [state.roomCode]);

  const timerAction = useCallback((action) => {
    socket.emit('timer-action', { code: state.roomCode, action });
  }, [state.roomCode]);

  const rotateLawyer = useCallback(() => {
    socket.emit('rotate-lawyer', { code: state.roomCode });
  }, [state.roomCode]);

  const spendToken = useCallback(() => {
    socket.emit('spend-token', { code: state.roomCode });
  }, [state.roomCode]);

  const sustainObjection = useCallback(() => {
    socket.emit('sustain-objection', { code: state.roomCode });
  }, [state.roomCode]);

  const dismissObjection = useCallback(() => {
    socket.emit('dismiss-objection', { code: state.roomCode });
  }, [state.roomCode]);

  const awardPoints = useCallback((playerId, points) => {
    socket.emit('award-points', { code: state.roomCode, playerId, points });
  }, [state.roomCode]);

  const revealTarget = useCallback(() => {
    socket.emit('reveal-target', { code: state.roomCode });
  }, [state.roomCode]);

  const endRound = useCallback((reason = 'manual') => {
    socket.emit('end-round', { code: state.roomCode, reason });
  }, [state.roomCode]);

  const nextRound = useCallback(() => {
    socket.emit('next-round', { code: state.roomCode });
  }, [state.roomCode]);

  const leaveRoom = useCallback(() => {
    localStorage.removeItem('objection_room_code');
    socket.disconnect();
    socket.connect();
    dispatch({ type: 'LEAVE_ROOM' });
  }, []);

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  // Derived helpers
  const me = state.roomState?.players?.find((p) => p.id === state.playerId) || null;
  const activeLawyer = state.roomState?.players?.[state.roomState?.activeLawyerIndex] || null;
  const witness = state.roomState?.players?.find((p) => p.role === 'witness') || null;
  const isHost = state.roomState?.hostId === state.playerId;
  const isWitness = me?.role === 'witness';
  const isActiveLawyer = activeLawyer?.id === state.playerId;

  const value = {
    ...state,
    me,
    activeLawyer,
    witness,
    isHost,
    isWitness,
    isActiveLawyer,
    // actions
    setName,
    createRoom,
    joinRoom,
    startGame,
    setTimerConfig,
    timerAction,
    rotateLawyer,
    spendToken,
    sustainObjection,
    dismissObjection,
    awardPoints,
    revealTarget,
    endRound,
    nextRound,
    leaveRoom,
    clearError,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
