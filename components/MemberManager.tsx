
import React, { useState } from 'react';
import { Member, Group } from '../types';

interface MemberManagerProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  groups: Group[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onAddGroup: (group: Group) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (id: string) => void;
}

export const MemberManager: React.FC<MemberManagerProps> = ({
  isOpen,
  onClose,
  members,
  groups,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'groups'>('members');

  // --- Member State ---
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberFormData, setMemberFormData] = useState<Partial<Member>>({});
  const [isAddingMember, setIsAddingMember] = useState(false);

  // --- Group State ---
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupFormData, setGroupFormData] = useState<Partial<Group>>({});
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  if (!isOpen) return null;

  // --- Member Functions ---
  const resetMemberForm = () => {
    setEditingMemberId(null);
    setIsAddingMember(false);
    setMemberFormData({});
  };

  const startEditMember = (member: Member) => {
    setEditingMemberId(member.id);
    setMemberFormData(member);
    setIsAddingMember(false);
  };

  const startAddMember = () => {
    setIsAddingMember(true);
    setEditingMemberId(null);
    setMemberFormData({
      id: Date.now().toString(),
      avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
      groupId: groups.length > 0 ? groups[0].id : '',
      password: '666666' // 默认初始密码
    });
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberFormData.name || !memberFormData.role || !memberFormData.groupId) {
       if (!memberFormData.groupId && groups.length > 0) {
          alert("请选择一个所属组");
          return;
       } else if (groups.length === 0) {
          alert("请先创建分组");
          return;
       }
       return;
    }

    const memberData = memberFormData as Member;
    
    if (isAddingMember) {
      onAddMember(memberData);
    } else {
      onUpdateMember(memberData);
    }
    resetMemberForm();
  };

  // --- Group Functions ---
  const resetGroupForm = () => {
    setEditingGroupId(null);
    setIsAddingGroup(false);
    setGroupFormData({});
  };

  const startEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setGroupFormData(group);
    setIsAddingGroup(false);
  };

  const startAddGroup = () => {
    setIsAddingGroup(true);
    setEditingGroupId(null);
    setGroupFormData({
      id: `g-${Date.now()}`,
      name: ''
    });
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupFormData.name) return;

    const groupData = groupFormData as Group;
    if (isAddingGroup) {
      onAddGroup(groupData);
    } else {
      onUpdateGroup(groupData);
    }
    resetGroupForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-2xl p-0 m-4 max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header with Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 pt-8 pb-0 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">团队架构中心</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">管理作战编制与登录权限</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-800 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex space-x-8">
            <button 
              onClick={() => setActiveTab('members')}
              className={`pb-3 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${
                activeTab === 'members' 
                  ? 'border-warning text-slate-800' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              全员名册
            </button>
            <button 
              onClick={() => setActiveTab('groups')}
              className={`pb-3 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${
                activeTab === 'groups' 
                  ? 'border-warning text-slate-800' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              编制分组
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          
          {/* ================= MEMBERS TAB ================= */}
          {activeTab === 'members' && (
            <>
              {!isAddingMember && !editingMemberId && (
                <div>
                  <div className="mb-6 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已集结人员: {members.length}</span>
                    <button 
                      onClick={startAddMember}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-black transition-all"
                    >
                      <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      扩充人员
                    </button>
                  </div>
                  
                  {members.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                      作战部暂无人员编制
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {members.map(member => {
                        const groupName = groups.find(g => g.id === member.groupId)?.name || '未归类';
                        return (
                          <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                            <div className="flex items-center space-x-4">
                              <img src={member.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm object-cover" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="font-black text-slate-800 text-sm">{member.name}</div>
                                  <span className="text-[9px] px-2 py-0.5 bg-warning/10 text-warning rounded-lg border border-warning/20 font-black uppercase tracking-widest">{groupName}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{member.role}</div>
                                {member.username && (
                                   <div className="text-[8px] text-slate-300 font-black uppercase tracking-tighter mt-1">
                                      接入账号: <span className="text-slate-400">{member.username}</span>
                                   </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => startEditMember(member)} className="p-2 bg-white text-slate-400 hover:text-warning rounded-lg shadow-sm border border-slate-100 transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm('确定要移出该人员吗？其指挥权限将被注销。')) onDeleteMember(member.id);
                                }} 
                                className="p-2 bg-white text-slate-400 hover:text-danger rounded-lg shadow-sm border border-slate-100 transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {(isAddingMember || editingMemberId) && (
                <form onSubmit={handleMemberSubmit} className="animate-[fadeIn_0.2s_ease-out] space-y-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-warning pl-3">{isAddingMember ? '新增人员编制' : '调整人员档案'}</h3>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">姓名</label>
                      <input 
                        type="text" 
                        value={memberFormData.name || ''} 
                        onChange={e => setMemberFormData({...memberFormData, name: e.target.value})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">所属组</label>
                      <select
                        value={memberFormData.groupId || ''}
                        onChange={e => setMemberFormData({...memberFormData, groupId: e.target.value})}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700"
                        required
                      >
                        <option value="" disabled>请选择编制...</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">职能/角色</label>
                    <input 
                      type="text" 
                      value={memberFormData.role || ''} 
                      onChange={e => setMemberFormData({...memberFormData, role: e.target.value})}
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700"
                      placeholder="例如：高级战略分析师"
                      required
                    />
                  </div>

                  {/* 核心改动：登录账号设置区 */}
                  <div className="p-6 bg-warning/5 border-2 border-warning/20 rounded-[2rem] space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="p-1.5 bg-warning rounded-lg text-slate-900 shadow-sm"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-3.04l.592.813a4.89 4.89 0 006.08 1.314" /></svg></div>
                       <span className="text-xs font-black text-slate-800 uppercase tracking-widest">指挥权限设置</span>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                       <div>
                         <label className="block text-[9px] font-black text-warning uppercase tracking-widest mb-1.5">登录账号 (Commander ID)</label>
                         <input 
                           type="text" 
                           value={memberFormData.username || ''} 
                           onChange={e => setMemberFormData({...memberFormData, username: e.target.value})}
                           className="w-full px-4 py-2.5 bg-white border border-warning/30 rounded-xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700 text-xs"
                           placeholder="设定登录名"
                         />
                       </div>
                       <div>
                         <label className="block text-[9px] font-black text-warning uppercase tracking-widest mb-1.5">初始密钥 (Passkey)</label>
                         <input 
                           type="password" 
                           value={memberFormData.password || ''} 
                           onChange={e => setMemberFormData({...memberFormData, password: e.target.value})}
                           className="w-full px-4 py-2.5 bg-white border border-warning/30 rounded-xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700 text-xs"
                           placeholder="设定初始密码"
                         />
                       </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold italic">注：设置账号后，该人员方可接入作战系统。初始密码建议 6 位以上。</p>
                  </div>

                  <div className="flex space-x-4 pt-4 border-t border-slate-100">
                    <button type="button" onClick={resetMemberForm} className="flex-1 py-4 px-6 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-800 transition-all">取消</button>
                    <button type="submit" className="flex-1 py-4 px-6 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">保存人员档案</button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ================= GROUPS TAB ================= */}
          {activeTab === 'groups' && (
            <>
              {!isAddingGroup && !editingGroupId && (
                 <div>
                    <div className="mb-6 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">活跃编制: {groups.length}</span>
                      <button 
                        onClick={startAddGroup}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-black transition-all"
                      >
                        <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        新增编制
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {groups.map(group => {
                        const memberCount = members.filter(m => m.groupId === group.id).length;
                        return (
                          <div key={group.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] hover:bg-white hover:shadow-md transition-all group">
                             <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-warning flex items-center justify-center font-black text-xl shadow-md">
                                  {group.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-black text-slate-800 text-sm uppercase tracking-tight">{group.name}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">集结成员: {memberCount} 名</div>
                                </div>
                             </div>
                             <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => startEditGroup(group)} className="p-2 bg-white text-slate-400 hover:text-warning rounded-lg shadow-sm border border-slate-100 transition-all">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button 
                                  onClick={() => {
                                     if(window.confirm('确定要解散该编制吗？')) onDeleteGroup(group.id);
                                  }} 
                                  className="p-2 bg-white text-slate-400 hover:text-danger rounded-lg shadow-sm border border-slate-100 transition-all"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
              )}

              {(isAddingGroup || editingGroupId) && (
                <form onSubmit={handleGroupSubmit} className="animate-[fadeIn_0.2s_ease-out] space-y-6">
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-warning pl-3">{isAddingGroup ? '创建新编制' : '调整编制名称'}</h3>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">编制名称</label>
                      <input 
                        type="text" 
                        value={groupFormData.name || ''} 
                        onChange={e => setGroupFormData({...groupFormData, name: e.target.value})}
                        placeholder="例如：技术研发部、战略支援组..."
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-warning outline-none font-bold text-slate-700"
                        required
                      />
                   </div>
                   <div className="flex space-x-4 pt-4 border-t border-slate-100">
                    <button type="button" onClick={resetGroupForm} className="flex-1 py-4 px-6 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-slate-800 transition-all">取消</button>
                    <button type="submit" className="flex-1 py-4 px-6 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">保存编制</button>
                  </div>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};
