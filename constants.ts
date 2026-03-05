
import { Member, Task, Group } from './types';

export const MOCK_GROUPS: Group[] = [
  { id: 'g1', name: '前端研发组' },
  { id: 'g2', name: '后端研发组' },
  { id: 'g3', name: '产品设计组' },
  { id: 'g4', name: '测试质量组' },
];

export const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: '李明', role: '前端工程师', groupId: 'g1', avatar: 'https://picsum.photos/seed/m1/100/100' },
  { id: 'm2', name: '王强', role: '后端架构师', groupId: 'g2', avatar: 'https://picsum.photos/seed/m2/100/100' },
  { id: 'm3', name: '张薇', role: 'UI 设计师', groupId: 'g3', avatar: 'https://picsum.photos/seed/m3/100/100' },
  { id: 'm4', name: '赵琳', role: '测试工程师', groupId: 'g4', avatar: 'https://picsum.photos/seed/m4/100/100' },
];

const today = new Date();
const formatDate = (daysAdd: number) => {
  const d = new Date();
  d.setDate(today.getDate() + daysAdd);
  return d.toISOString().split('T')[0];
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: '用户中心重构',
    outcome: '完成用户登录、注册、找回密码页面的全新 UI 实现并上线，提升加载速度 30%。',
    projectId: 'default_project',
    assigneeIds: ['m1'],
    managerIds: ['m1'], // 指定负责人
    startDate: formatDate(-5),
    dueDate: formatDate(2),
    progress: 85,
    logs: [
      { id: 'l1', date: formatDate(-1), progressSnapshot: 80, note: '完成登录页动画 optimization' }
    ],
    executionTasks: [
      { id: 'ms1', title: 'UI组件库选型', outcome: '确认符合业务需求且性能最优的 UI 框架', isCompleted: true, assigneeIds: [], progress: 100, startDate: formatDate(-5), dueDate: formatDate(-4) },
      { id: 'ms2', title: '登录页面开发', outcome: '完成符合设计规范的登录页面代码实现', isCompleted: true, assigneeIds: [], progress: 100, startDate: formatDate(-4), dueDate: formatDate(-2) },
      { id: 'ms3', title: '注册流程联调', outcome: '前后端联调通过，确保注册数据正确入库', isCompleted: true, assigneeIds: [], progress: 100, startDate: formatDate(-2), dueDate: formatDate(-1) },
      { id: 'ms4', title: '性能测试与优化', outcome: '产出性能测试报告，并完成核心耗时路径优化', isCompleted: false, assigneeIds: [], progress: 40, startDate: formatDate(-1), dueDate: formatDate(2) }
    ]
  },
  {
    id: 't2',
    title: '支付网关集成',
    outcome: '接入支付宝和微信支付，确保 99.9% 的支付成功率，完成所有异常场景测试。',
    projectId: 'default_project',
    assigneeIds: ['m2'],
    managerIds: ['m2'], // 指定负责人
    startDate: formatDate(-10),
    dueDate: formatDate(-1), 
    progress: 60,
    logs: [
      { id: 'l2', date: formatDate(-2), progressSnapshot: 60, note: '微信支付签名问题卡顿，正在排查' }
    ],
    executionTasks: [
      { id: 'ms1', title: '支付宝 SDK 接入', outcome: '成功发起支付宝支付请求并接收回调', isCompleted: true, assigneeIds: [], progress: 100, startDate: formatDate(-10), dueDate: formatDate(-7) },
      { id: 'ms2', title: '微信支付 SDK 接入', outcome: '成功发起微信支付请求并接收回调', isCompleted: false, assigneeIds: [], progress: 50, startDate: formatDate(-7), dueDate: formatDate(-4) },
      { id: 'ms3', title: '退款流程开发', outcome: '完成订单退款逻辑及接口实现', isCompleted: false, assigneeIds: [], progress: 30, startDate: formatDate(-4), dueDate: formatDate(-1) }
    ]
  },
  {
    id: 't3',
    title: '设计系统规范 v2.0',
    outcome: '输出完整的 Figma 组件库，包含 Token 定义，确保开发设计一致性。',
    projectId: 'default_project',
    assigneeIds: ['m3'],
    managerIds: ['m3'], // 指定负责人
    startDate: formatDate(-3),
    dueDate: formatDate(7),
    progress: 30,
    logs: [],
    executionTasks: []
  }
];
