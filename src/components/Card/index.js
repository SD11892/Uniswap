import styled from 'styled-components'
import { Box } from 'rebass/styled-components'

const Card = styled(Box)`
  width: 100%;
  border-radius: 8px;
  padding: 1rem;
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
`
export default Card

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.outlineGrey};
`

export const GreyCard = styled(Card)`
  background-color: rgba(255, 255, 255, 0.9);
`
