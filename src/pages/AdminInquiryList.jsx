import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_ENDPOINTS } from '../config/api';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import MainContent from '../components/common/MainContent';
import Select from '../components/common/Select';
import Pagination from '../components/common/Pagination';
import { ActionBadge } from '../components/common/Badge';

const AdminInquiryList = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchParams, setSearchParams] = useState({
    title: '',
    creatorName: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || user.companyRole !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    if (currentPage === 0 && !searchParams.title && !searchParams.creatorName && !searchParams.status && !searchParams.startDate && !searchParams.endDate) {
      fetchInquiries();
    }
  }, [user, authLoading, currentPage]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      params.append('page', currentPage);
      params.append('size', '10');
      params.append('sort', 'createdAt,desc');

      if (searchParams.title?.trim()) {
        params.append('title', searchParams.title.trim());
      }
      if (searchParams.creatorName?.trim()) {
        params.append('creatorName', searchParams.creatorName.trim());
      }
      if (searchParams.status) {
        params.append('status', searchParams.status);
      }
      if (searchParams.startDate) {
        params.append('startDate', searchParams.startDate);
      }
      if (searchParams.endDate) {
        params.append('endDate', searchParams.endDate);
      }

      console.log('Search params:', params.toString());

      const { data } = await axiosInstance.get(`${API_ENDPOINTS.ADMIN_INQUIRY_SEARCH}?${params.toString()}`, {
        withCredentials: true
      });
      
      setInquiries(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      setInquiries([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchInquiries();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').slice(0, -1);
  };

  const getStatusBadge = (inquiryStatus) => {
    switch (inquiryStatus) {
      case 'PENDING':
        return { text: '답변 대기', color: '#DC2626' };
      case 'COMPLETED':
        return { text: '답변 완료', color: '#64748B' };
      default:
        return { text: '답변 대기', color: '#64748B' };
    }
  };

  const handleStatusClick = () => {
    setIsStatusOpen(!isStatusOpen);
  };

  const handleStatusSelect = (value) => {
    setSearchParams(prev => ({
      ...prev,
      status: value
    }));
    setIsStatusOpen(false);
  };

  return (
    <PageContainer>
      <MainContent>
        <Header>
          <HeaderTop>
            <PageTitle>문의사항 관리</PageTitle>
          </HeaderTop>
          <SearchSection>
            <SearchInput
              type="text"
              name="title"
              placeholder="제목 검색"
              value={searchParams.title}
              onChange={handleSearchChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <SearchInput
              type="text"
              name="creatorName"
              placeholder="작성자 검색"
              value={searchParams.creatorName}
              onChange={handleSearchChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <StatusSelectContainer>
              <StatusSelectButton onClick={handleStatusClick}>
                {searchParams.status ? 
                  (searchParams.status === 'PENDING' ? '답변 대기' : 
                   searchParams.status === 'COMPLETED' ? '답변 완료' : '전체') 
                  : '전체'}
                <SelectArrow isOpen={isStatusOpen}>▼</SelectArrow>
              </StatusSelectButton>
              {isStatusOpen && (
                <StatusDropdown>
                  <StatusOption onClick={() => handleStatusSelect('')}>전체</StatusOption>
                  <StatusOption onClick={() => handleStatusSelect('PENDING')}>답변 대기</StatusOption>
                  <StatusOption onClick={() => handleStatusSelect('COMPLETED')}>답변 완료</StatusOption>
                </StatusDropdown>
              )}
            </StatusSelectContainer>
            <DateInputGroup>
              <SearchInput
                type="date"
                name="startDate"
                value={searchParams.startDate}
                onChange={handleSearchChange}
                max={searchParams.endDate || undefined}
              />
              <DateSeparator>~</DateSeparator>
              <SearchInput
                type="date"
                name="endDate"
                value={searchParams.endDate}
                onChange={handleSearchChange}
                min={searchParams.startDate || undefined}
              />
            </DateInputGroup>
            <ActionBadge 
              type="success" 
              size="large" 
              onClick={handleSearch}
            >
              검색
            </ActionBadge>
          </SearchSection>
        </Header>

        {loading ? (
          <LoadingMessage>데이터를 불러오는 중...</LoadingMessage>
        ) : (
          <>
            <TableInfo>
              총 {totalElements}개의 문의사항
            </TableInfo>
            <UsersTable>
              <thead>
                <tr>
                  <TableHeaderCell>제목</TableHeaderCell>
                  <TableHeaderCell>작성자</TableHeaderCell>
                  <TableHeaderCell>작성일</TableHeaderCell>
                  <TableHeaderCell>상태</TableHeaderCell>
                  <TableHeaderCell>상세보기</TableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id} onClick={() => navigate(`/admin/inquiry/${inquiry.id}`)}>
                    <TableCell>{inquiry.title}</TableCell>
                    <TableCell nowrap>{inquiry.creatorName}</TableCell>
                    <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
                    <TableCell nowrap>
                      <StatusBadge status={inquiry.inquiryStatus}>
                        {getStatusBadge(inquiry.inquiryStatus).text}
                      </StatusBadge>
                    </TableCell>
                    <TableCell nowrap>
                      <ActionButtonContainer onClick={(e) => e.stopPropagation()}>
                        <ActionBadge 
                          type="primary" 
                          size="medium" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/inquiry/${inquiry.id}`);
                          }}
                        >
                          상세보기
                        </ActionBadge>
                      </ActionButtonContainer>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </UsersTable>
            {totalElements > 0 && (
              <Pagination
                currentPage={currentPage}
                totalElements={totalElements}
                pageSize={10}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
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
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 24px;
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
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

const SearchSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: nowrap;
  width: 100%;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  width: ${props => props.type === 'date' ? '130px' : '140px'};
  min-width: 0;
  transition: all 0.2s;
  
  &::placeholder {
    color: #94a3b8;
  }

  &:hover {
    border-color: #cbd5e1;
  }
  
  &:focus {
    outline: none;
    border-color: #2E7D32;
    box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.1);
  }

  &[type="date"] {
    &::-webkit-calendar-picker-indicator {
      cursor: pointer;
      padding: 4px;
      margin-right: 4px;
      opacity: 0.6;
      &:hover {
        opacity: 1;
      }
    }
  }
`;

const StyledSelect = styled(Select)`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  min-width: 120px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #cbd5e1;
  }
  
  &:focus {
    outline: none;
    border-color: #2E7D32;
    box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.1);
  }
`;

const DateInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const DateSeparator = styled.span`
  color: #64748b;
  font-size: 14px;
  margin: 0 4px;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #64748b;
`;

const UsersTable = styled.table`
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
  white-space: ${props => props.nowrap ? 'nowrap' : 'normal'};
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: -0.02em;
  transition: all 0.15s ease;
  background: ${props => {
    switch (props.status) {
      case 'PENDING': return '#FEF3C7';
      case 'IN_PROGRESS': return '#DBEAFE';
      case 'COMPLETED': return '#DCFCE7';
      case 'ON_HOLD': return '#FEE2E2';
      default: return '#F8FAFC';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'PENDING': return '#D97706';
      case 'IN_PROGRESS': return '#2563EB';
      case 'COMPLETED': return '#16A34A';
      case 'ON_HOLD': return '#DC2626';
      default: return '#64748B';
    }
  }};

  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    margin-right: 6px;
    background: currentColor;
  }
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  white-space: nowrap;
`;

const TableInfo = styled.div`
  margin: 16px 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;

const StatusSelectContainer = styled.div`
  position: relative;
  width: 120px;
  flex-shrink: 0;
`;

const StatusSelectButton = styled.button`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  
  &:hover {
    border-color: #cbd5e1;
  }
  
  &:focus {
    outline: none;
    border-color: #2E7D32;
    box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.1);
  }
`;

const SelectArrow = styled.span`
  font-size: 10px;
  color: #64748b;
  transition: transform 0.2s;
  transform: rotate(${props => props.isOpen ? '180deg' : '0deg'});
`;

const StatusDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 10;
  overflow: hidden;
`;

const StatusOption = styled.div`
  padding: 8px 12px;
  font-size: 14px;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
    color: #2E7D32;
  }

  &:active {
    background: #f1f5f9;
  }
`;

export default AdminInquiryList; 