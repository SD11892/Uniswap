import React, { useState, useCallback, useEffect } from 'react'
import { OutlineCard } from 'components/Card'
import { RowBetween } from 'components/Row'
import { Input as NumericalInput } from '../NumericalInput'
import styled, { keyframes, css } from 'styled-components'
import { TYPE } from 'theme'
import { AutoColumn } from 'components/Column'
import { ButtonSecondary } from 'components/Button'
import { FeeAmount } from '@uniswap/v3-sdk'
import { formattedFeeAmount } from 'utils'

const pulse = (color: string) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${color};
  }

  70% {
    box-shadow: 0 0 0 2px ${color};
  }

  100% {
    box-shadow: 0 0 0 0 ${color};
  }
`

const SmallButton = styled(ButtonSecondary)`
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 8px;
  padding: 4px;
  width: 48%;
`

const FocusedOutlineCard = styled(OutlineCard)<{ active?: boolean; pulsing?: boolean }>`
  border-color: ${({ active, theme }) => active && theme.blue1};
  padding: 12px;

  ${({ pulsing, theme }) =>
    pulsing &&
    css`
      animation: ${pulse(theme.blue1)} 0.8s linear;
    `}
`

const StyledInput = styled(NumericalInput)<{ usePercent?: boolean }>`
  background-color: ${({ theme }) => theme.bg0};
  text-align: left;
  margin-right: 2px;
`

const ContentWrapper = styled(RowBetween)`
  width: 92%;
`

interface StepCounterProps {
  value: string
  onUserInput: (value: string) => void
  getDecrementValue?: () => string
  getIncrementValue?: () => string
  feeAmount?: FeeAmount
  label?: string
  width?: string
  locked?: boolean // disable input
}

const StepCounter = ({
  value,
  onUserInput,
  getDecrementValue,
  getIncrementValue,
  feeAmount,
  label,
  width,
  locked,
}: StepCounterProps) => {
  //  for focus state, styled components doesnt let you select input parent container
  const [active, setActive] = useState(false)

  // let user type value and only update parent value on blur
  const [localValue, setLocalValue] = useState('')
  const [useLocalValue, setUseLocalValue] = useState(false)

  // animation if parent value updates local value
  const [pulsing, setPulsing] = useState<boolean>(false)

  // format fee amount
  const feeAmountFormatted = feeAmount ? formattedFeeAmount(feeAmount) : ''

  const handleOnFocus = () => {
    setUseLocalValue(true)
    setActive(true)
  }

  // for button clicks
  const handleDecrement = useCallback(() => {
    if (getDecrementValue) {
      setLocalValue(getDecrementValue())
      onUserInput(getDecrementValue())
    }
  }, [getDecrementValue, onUserInput])

  const handleIncrement = useCallback(() => {
    if (getIncrementValue) {
      setLocalValue(getIncrementValue())
      onUserInput(getIncrementValue())
    }
  }, [getIncrementValue, onUserInput])

  const handleOnBlur = useCallback(() => {
    setUseLocalValue(false)
    setActive(false)
    onUserInput(localValue) // trigger update on parent value
  }, [localValue, onUserInput])

  useEffect(() => {
    if (localValue !== value && !useLocalValue) {
      setTimeout(() => {
        setLocalValue(value) // reset local value to match parent
        setPulsing(true) // trigger animation
        setTimeout(function () {
          setPulsing(false)
        }, 1800)
      }, 0)
    }
  }, [localValue, useLocalValue, value])

  return (
    <FocusedOutlineCard pulsing={pulsing} active={active} onFocus={handleOnFocus} onBlur={handleOnBlur} width={width}>
      <AutoColumn gap="md">
        <ContentWrapper>
          <StyledInput
            className="rate-input-0"
            value={localValue}
            fontSize="18px"
            disabled={locked}
            onUserInput={(val) => {
              setLocalValue(val)
            }}
          />
        </ContentWrapper>
        {label && <TYPE.label fontSize="12px">{label}</TYPE.label>}
        {getDecrementValue && getIncrementValue && !locked ? (
          <RowBetween>
            <SmallButton onClick={handleDecrement}>
              <TYPE.main fontSize="12px">-{feeAmountFormatted}%</TYPE.main>
            </SmallButton>
            <SmallButton onClick={handleIncrement}>
              <TYPE.main fontSize="12px">+{feeAmountFormatted}%</TYPE.main>
            </SmallButton>
          </RowBetween>
        ) : null}
      </AutoColumn>
    </FocusedOutlineCard>
  )
}

export default StepCounter
