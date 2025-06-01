import styled from "styled-components";
import theme from '@/styles/theme';
import { ReactNode } from "react";

const Container = styled.div`
  margin-top: ${theme.navbar.height};
  padding: 0 20px;
`;

interface PageProps {
  children: ReactNode;
}

const Page: React.FC<PageProps> = ({ children }) => {
  return (
    <Container>
      {children}
    </Container>
  );
};

export default Page;
