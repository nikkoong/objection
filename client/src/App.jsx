import { GameProvider, useGame } from './context/GameContext';
import Landing from './components/Landing';
import WaitingRoom from './components/WaitingRoom';
import LawyerView from './components/LawyerView';
import WitnessView from './components/WitnessView';
import RoundEnd from './components/RoundEnd';

function GameRouter() {
  const { screen, isWitness } = useGame();

  switch (screen) {
    case 'landing':
      return <Landing />;
    case 'waiting':
      return <WaitingRoom />;
    case 'playing':
      return isWitness ? <WitnessView /> : <LawyerView />;
    case 'round-end':
      return <RoundEnd />;
    default:
      return <Landing />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
