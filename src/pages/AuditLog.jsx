import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../utils/axiosInstance';
import MainContent from '../components/common/MainContent';
import Select from '../components/common/Select';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import { ActionBadge } from '../components/common/Badge';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [filters, setFilters] = useState({
    actionType: '',
    targetType: '',
    startDate: '',
    endDate: '',
    userId: '',
    page: 1
  });
  const [searchParams, setSearchParams] = useState({
    actionType: '',
    targetType: '',
    startDate: '',
    endDate: '',
    userId: '',
    page: 1
  });
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursor, setCursor] = useState({ loggedAt: '', id: '' });
  const [nextCursor, setNextCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, [searchParams]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        ...searchParams,
        size: 10
      };
      Object.entries(params).forEach(([key, value]) => {
        if (value === '' || value === undefined || value === null) {
          delete params[key];
        }
      });
      const { data } = await axiosInstance.get(`/auditLog/searchCursor`, { params });
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(data.currentPage || 1);
      setNextCursor(data.nextCursor || null);
      setCursor(data.cursor || { loggedAt: '', id: '' });
    } catch (error) {
      setLogs([]);
      setTotalPages(0);
      setCurrentPage(1);
      setNextCursor(null);
      setCursor({ loggedAt: '', id: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page: page + 1 }));
    setCurrentPage(page + 1);
    setSearchParams(prev => ({ ...prev, page: page + 1 }));
  };

  const handleSearch = () => {
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      setAlertMessage('시작일은 종료일보다 이전이어야 합니다.');
      setShowAlertModal(true);
      return;
    }
    setSearchParams({ ...filters, page: 1 });
    setCurrentPage(1);
  };

  const handleNext = () => {
    if (nextCursor) {
      setCursorStack(prev => [...prev, cursor]);
      fetchLogs(nextCursor);
    }
  };

  const handlePrev = () => {
    if (cursorStack.length > 0) {
      const prevStack = [...cursorStack];
      const prevCursor = prevStack.pop();
      setCursorStack(prevStack);
      fetchLogs(prevCursor);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case 'CREATE':
        return '#2E7D32';
      case 'UPDATE':
      case 'MODIFY':
        return '#2563eb';
      case 'DELETE':
        return '#EF4444';
      default:
        return '#64748b';
    }
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  return (
    <PageContainer>
      <MainContent>
        <Header>
          <HeaderLeft>
            <PageTitle>로그 기록</PageTitle>
            <FilterContainer>
              <select
                name="actionType"
                value={filters.actionType}
                onChange={handleFilterChange}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '120px',
                  marginRight: '0'
                }}
              >
                <option value="">--</option>
                <option value="CREATE">CREATE</option>
                <option value="MODIFY">MODIFY</option>
                <option value="DELETE">DELETE</option>
              </select>
              <select
                name="targetType"
                value={filters.targetType}
                onChange={handleFilterChange}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '120px',
                  marginRight: '0'
                }}
              >
                <option value="">--</option>
                <option value="USER">USER</option>
                <option value="COMPANY">COMPANY</option>
                <option value="PROJECT">PROJECT</option>
                <option value="POST">POST</option>
                <option value="COMMENT">COMMENT</option>
                <option value="LINK">LINK</option>
              </select>
              <DateInput
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                placeholder="시작일"
              />
              <DateInput
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                placeholder="종료일"
              />
              <Input type="text" name="userId" value={filters.userId} onChange={handleFilterChange} placeholder="사용자 ID" />
              <ActionBadge 
                type="success" 
                size="large" 
                onClick={handleSearch}
              >
                검색
              </ActionBadge>
            </FilterContainer>
          </HeaderLeft>
        </Header>

        {loading ? (
          <LoadingMessage>로딩중...</LoadingMessage>
        ) : logs.length === 0 ? (
          <LoadingMessage>데이터가 없습니다.</LoadingMessage>
        ) : (
          <>
            <LogTable>
              <thead>
                <tr>
                  <TableHeaderCell>시간</TableHeaderCell>
                  <TableHeaderCell>사용자 ID</TableHeaderCell>
                  <TableHeaderCell>액션</TableHeaderCell>
                  <TableHeaderCell>대상 타입</TableHeaderCell>
                  <TableHeaderCell>대상 ID</TableHeaderCell>
                  <TableHeaderCell>상세 정보</TableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.loggedAt)}</TableCell>
                    <TableCell>{log.actorId}</TableCell>
                    <TableCell>
                      <ActionBadge 
                        type={log.actionType === 'CREATE' ? 'success' : 
                              log.actionType === 'MODIFY' ? 'primary' : 
                              log.actionType === 'DELETE' ? 'danger' : 'secondary'}
                        size="small"
                      >
                        {log.actionType}
                      </ActionBadge>
                    </TableCell>
                    <TableCell>
                      <ActionBadge 
                        type={
                          log.targetType === 'COMPANY' ? 'info' :
                          log.targetType === 'PROJECT' ? 'success' :
                          log.targetType === 'LINK' ? 'warning' :
                          log.targetType === 'POST' ? 'dark' :
                          log.targetType === 'USER' ? 'primary' :
                          log.targetType === 'COMMENT' ? 'danger' : 'secondary'
                        }
                        size="small"
                      >
                        {log.targetType}
                      </ActionBadge>
                    </TableCell>
                    <TableCell>{log.targetId}</TableCell>
                    <TableCell>
                      {log.details && log.details.length > 0 ? (
                        <ActionBadge 
                          type="primary" 
                          size="medium" 
                          onClick={() => handleLogClick(log)}
                        >
                          상세보기
                        </ActionBadge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </LogTable>
            {totalPages > 0 && (
              <Pagination
                currentPage={currentPage - 1}
                totalElements={totalPages * 10}
                pageSize={10}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}

        {showModal && selectedLog && (
          <ModalOverlay onClick={() => setShowModal(false)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>변경 상세 정보</ModalTitle>
                <ActionBadge 
                  type="danger" 
                  size="large" 
                  onClick={() => setShowModal(false)}
                >
                  ×
                </ActionBadge>
              </ModalHeader>
              <ModalBody>
                {selectedLog.details.map((detail, index) => (
                  <DetailItem key={index}>
                    <DetailField>{detail.fieldName}</DetailField>
                    <DetailValue>
                      <ValueRow>
                        <ValueLabel>이전 값:</ValueLabel>
                        <ValueContent>{detail.oldValue || '-'}</ValueContent>
                      </ValueRow>
                      <ValueRow>
                        <ValueLabel>새로운 값:</ValueLabel>
                        <ValueContent>{detail.newValue || '-'}</ValueContent>
                      </ValueRow>
                    </DetailValue>
                  </DetailItem>
                ))}
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}

        <ConfirmModal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          onConfirm={() => setShowAlertModal(false)}
          title="알림"
          message={alertMessage}
          confirmText="확인"
          cancelText="취소"
          type="warning"
        />
      </MainContent>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
`;

const Header = styled.div`
  margin-bottom: 24px;
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const HeaderLeft = styled.div`
  flex: 1;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  letter-spacing: -0.01em;

  &::before {
    content: '';
    display: block;
    width: 3px;
    height: 20px;
    background: #2E7D32;
    border-radius: 1.5px;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
  width: 100%;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  &[type="date"] {
    width: 140px;
  }
  
  &[type="text"] {
    width: 120px;
  }
  
  &[type="number"] {
    width: 80px;
  }
  
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  &:focus {
    outline: none;
    border-color: #2E7D32;
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15);
  }
`;

const LogTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-top: 24px;
`;

const TableHeaderCell = styled.th`
  padding: 16px 24px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  background: white;
  border-bottom: 1px solid #e2e8f0;
`;

const TableRow = styled.tr`
  cursor: pointer;
  transition: all 0.2s;
  background: white;

  &:hover {
    background: #f8fafc;
  }
`;

const TableCell = styled.td`
  padding: 16px 24px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
  background: white;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #64748b;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 16px;
  max-width: 80%;
  max-height: 80%;
  overflow: auto;
  min-width: 600px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const DetailItem = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 16px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  align-items: start;
`;

const DetailField = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  word-break: keep-all;
`;

const DetailValue = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
`;

const ValueRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: baseline;
`;

const ValueLabel = styled.span`
  font-weight: 500;
  color: #475569;
  min-width: 80px;
`;

const ValueContent = styled.span`
  flex: 1;
  word-break: break-all;
`;

const DateInput = styled.input`
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 140px;
  
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  &:focus {
    outline: none;
    border-color: #2E7D32;
    box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15);
  }

  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    padding: 4px;
    margin-right: 4px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  &::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
`;

export default AuditLog;