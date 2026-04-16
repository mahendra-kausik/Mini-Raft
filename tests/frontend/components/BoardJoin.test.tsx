import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BoardJoin } from '../../../frontend/src/components/BoardJoin';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BoardJoin', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders create and join buttons', () => {
    render(<MemoryRouter><BoardJoin /></MemoryRouter>);
    expect(screen.getByTestId('create-board')).toBeInTheDocument();
    expect(screen.getByTestId('join-board')).toBeInTheDocument();
    expect(screen.getByTestId('board-code-input')).toBeInTheDocument();
  });

  it('navigates to a new board on create', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><BoardJoin /></MemoryRouter>);
    await user.click(screen.getByTestId('create-board'));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const path = mockNavigate.mock.calls[0][0] as string;
    expect(path).toMatch(/^\/board\/[a-z0-9]{6}$/);
  });

  it('navigates to entered board code on join', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><BoardJoin /></MemoryRouter>);
    await user.type(screen.getByTestId('board-code-input'), 'abc123');
    await user.click(screen.getByTestId('join-board'));
    expect(mockNavigate).toHaveBeenCalledWith('/board/abc123');
  });

  it('does not navigate with empty code', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><BoardJoin /></MemoryRouter>);
    await user.click(screen.getByTestId('join-board'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
