/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

function Hello({ name }: { name: string }) {
  return <p>안녕하세요, {name}!</p>;
}

describe("컴포넌트 렌더링", () => {
  it("should render name correctly", () => {
    render(<Hello name="홍길동" />);
    expect(screen.getByText("안녕하세요, 홍길동!")).toBeInTheDocument();
  });
});
