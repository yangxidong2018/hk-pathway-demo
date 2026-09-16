import {translate} from './i18n.js';

// The Feishu table controls matching and links. This catalogue controls how its
// fixed article IDs are presented in each product locale.
const titles={
 'HK-READY-1':['Setting up a business in Hong Kong','Thành lập doanh nghiệp tại Hồng Kông','Abrir uma empresa em Hong Kong'],
 'HK-READY-2':['How to register a new company','Cách đăng ký công ty mới','Como registrar uma nova empresa'],
 'HK-READY-3':['Annual return for a local private company','Báo cáo thường niên của công ty tư nhân địa phương','Declaração anual de empresa privada local'],
 'HK-FOUNDATION-1':['Frequently asked questions about incorporating a local limited company','Câu hỏi thường gặp khi thành lập công ty trách nhiệm hữu hạn địa phương','Perguntas frequentes sobre a constituição de uma sociedade limitada local'],
 'HK-FOUNDATION-2':['Main fees charged by the Companies Registry','Principais mức phí của Cơ quan Đăng ký Công ty','Principais taxas do Registro de Empresas'],
 'HK-FOUNDATION-3':['Starting a business: licences, registration and legislation','Khởi nghiệp: giấy phép, đăng ký và pháp luật','Empreender: licenças, registro e legislação'],
 'HK-EXPLORE-1':["Hong Kong's open business environment",'Môi trường kinh doanh cởi mở của Hồng Kông','O ambiente de negócios aberto de Hong Kong'],
 'HK-EXPLORE-2':['Going global through Hong Kong','Vươn ra toàn cầu thông qua Hồng Kông','Expandir globalmente por Hong Kong'],
 'HK-EXPLORE-3':["Hong Kong's connectivity advantages",'Lợi thế kết nối của Hồng Kông','Vantagens de conectividade de Hong Kong'],
 'HK-PREPARE-1':['Setting up a business and investing in Hong Kong','Thành lập doanh nghiệp và đầu tư tại Hồng Kông','Estabelecer uma empresa e investir em Hong Kong'],
 'HK-PREPARE-2':['Doing business in Hong Kong','Kinh doanh tại Hồng Kông','Fazer negócios em Hong Kong'],
 'HK-PREPARE-3':['Business registration and company incorporation','Đăng ký kinh doanh và thành lập công ty','Registro comercial e constituição de empresa'],
 'SG-READY-1':['How to register a local Singapore company through BizFile','Como registrar uma empresa local de Singapura pelo BizFile','Como registrar uma empresa local de Singapura pelo BizFile'],
 'SG-READY-2':['What to complete after incorporating a company','Việc cần hoàn tất sau khi thành lập công ty','O que concluir após constituir uma empresa'],
 'SG-READY-3':['Annual filing requirements for Singapore companies','Yêu cầu khai báo hằng năm của công ty Singapore','Requisitos anuais de declaração para empresas de Singapura'],
 'SG-FOUNDATION-1':['Basic requirements for foreigners registering a business in Singapore','Yêu cầu cơ bản để người nước ngoài đăng ký doanh nghiệp tại Singapore','Requisitos básicos para estrangeiros registrarem uma empresa em Singapura'],
 'SG-FOUNDATION-2':['Main ways for foreign businesses to enter Singapore','Principais formas de entrada de empresas estrangeiras em Singapura','Principais formas de empresas estrangeiras entrarem em Singapura'],
 'SG-FOUNDATION-3':['A basic guide to Singapore corporate income tax','Hướng dẫn cơ bản về thuế thu nhập doanh nghiệp tại Singapore','Guia básico do imposto de renda corporativo de Singapura'],
 'SG-EXPLORE-1':['Why Singapore has a business-friendly environment','Vì sao Singapore có môi trường kinh doanh thân thiện','Por que Singapura tem um ambiente favorável aos negócios'],
 'SG-EXPLORE-2':['Why Singapore is an Asian economic hub','Vì sao Singapore là trung tâm kinh tế châu Á','Por que Singapura é um centro econômico asiático'],
 'SG-EXPLORE-3':["Singapore's global connectivity and infrastructure advantages",'Lợi thế kết nối toàn cầu và hạ tầng của Singapore','Vantagens de conectividade global e infraestrutura de Singapura'],
 'SG-PREPARE-1':['Five steps to set up a business in Singapore','Năm bước để thành lập doanh nghiệp tại Singapore','Cinco etapas para estabelecer uma empresa em Singapura'],
 'SG-PREPARE-2':['Guide to business setup procedures and costs in Singapore','Hướng dẫn quy trình và chi phí thành lập doanh nghiệp tại Singapore','Guia de procedimentos e custos para abrir uma empresa em Singapura'],
 'SG-PREPARE-3':['How foreign businesses can operate in Singapore','Cách doanh nghiệp nước ngoài có thể hoạt động tại Singapore','Como empresas estrangeiras podem operar em Singapura'],
 'US-READY-1':['Starting a business in the United States: location, registration and licences','Khởi nghiệp tại Hoa Kỳ: địa điểm, đăng ký và giấy phép','Abrir uma empresa nos Estados Unidos: local, registro e licenças'],
 'US-READY-2':['How to apply for a U.S. Employer Identification Number (EIN)','Cách đăng ký Mã số Nhận diện Nhà tuyển dụng Hoa Kỳ (EIN)','Como solicitar um Número de Identificação do Empregador dos EUA (EIN)'],
 'US-READY-3':['Official state business registration and tax portals','Cổng thông tin chính thức về đăng ký doanh nghiệp và thuế của các bang Hoa Kỳ','Portais oficiais estaduais de registro empresarial e tributos'],
 'US-FOUNDATION-1':['Key considerations for foreign investors entering the United States','Các điểm then chốt cho nhà đầu tư nước ngoài vào Hoa Kỳ','Pontos essenciais para investidores estrangeiros entrarem nos Estados Unidos'],
 'US-FOUNDATION-2':['Federal tax obligations of foreign companies in the United States','Nghĩa vụ thuế liên bang của doanh nghiệp nước ngoài tại Hoa Kỳ','Obrigações tributárias federais de empresas estrangeiras nos Estados Unidos'],
 'US-FOUNDATION-3':['Federal tax matters new U.S. businesses should know','Các vấn đề thuế liên bang mà doanh nghiệp mới tại Hoa Kỳ cần biết','Questões tributárias federais que novas empresas nos EUA devem conhecer'],
 'US-EXPLORE-1':['Why invest in the United States','Vì sao đầu tư vào Hoa Kỳ','Por que investir nos Estados Unidos'],
 'US-EXPLORE-2':['U.S. investment and regional data tools','Công cụ dữ liệu đầu tư và khu vực của Hoa Kỳ','Ferramentas de dados de investimento e regiões dos EUA'],
 'US-EXPLORE-3':['U.S. foreign direct investment data and industry overview','Dữ liệu đầu tư trực tiếp nước ngoài và tổng quan ngành tại Hoa Kỳ','Dados de investimento estrangeiro direto e visão geral setorial dos EUA'],
 'US-PREPARE-1':['Official U.S. services and tools for foreign investors','Dịch vụ và công cụ chính thức của Hoa Kỳ dành cho nhà đầu tư nước ngoài','Serviços e ferramentas oficiais dos EUA para investidores estrangeiros'],
 'US-PREPARE-2':['U.S. investment information, state resources and incentives','Thông tin đầu tư Hoa Kỳ, nguồn lực cấp bang và ưu đãi','Informações de investimento nos EUA, recursos estaduais e incentivos'],
 'US-PREPARE-3':['Business planning before entering the U.S. market','Lập kế hoạch kinh doanh trước khi vào thị trường Hoa Kỳ','Planejamento empresarial antes de entrar no mercado dos EUA'],
 'VN-READY-1':['The 2025 Investment Law takes effect: what foreign investors need to know','Luật Đầu tư 2025 có hiệu lực: điều nhà đầu tư nước ngoài cần biết','Lei de Investimento de 2025 em vigor: o que investidores estrangeiros precisam saber'],
 'VN-READY-2':['Key procedures for implementing investment projects in Vietnam','Các thủ tục chính để triển khai dự án đầu tư tại Việt Nam','Principais procedimentos para implementar projetos de investimento no Vietnã'],
 'VN-READY-3':['Procedures for establishing a foreign-invested enterprise','Quy trình thành lập doanh nghiệp có vốn đầu tư nước ngoài','Procedimentos para estabelecer uma empresa com investimento estrangeiro'],
 'VN-FOUNDATION-1':['Main forms of business organisation in Vietnam','Các loại hình tổ chức doanh nghiệp chủ yếu tại Việt Nam','Principais formas de organização empresarial no Vietnã'],
 'VN-FOUNDATION-2':['Prohibited and conditional business lines in Vietnam','Ngành nghề kinh doanh bị cấm và có điều kiện tại Việt Nam','Atividades empresariais proibidas e condicionadas no Vietnã'],
 'VN-FOUNDATION-3':['Overview of investment incentives in Vietnam','Tổng quan chính sách ưu đãi đầu tư tại Việt Nam','Visão geral dos incentivos ao investimento no Vietnã'],
 'VN-EXPLORE-1':['Vietnam investment opportunities and priority projects portal','Cổng thông tin cơ hội đầu tư và dự án trọng điểm tại Việt Nam','Portal de oportunidades de investimento e projetos prioritários do Vietnã'],
 'VN-EXPLORE-2':['Vietnam’s 2026 foreign investment environment and new opportunities','Môi trường đầu tư nước ngoài năm 2026 và cơ hội mới tại Việt Nam','Ambiente de investimento estrangeiro de 2026 e novas oportunidades no Vietnã'],
 'VN-EXPLORE-3':['Vietnam investment promotion guide','Hướng dẫn xúc tiến đầu tư tại Việt Nam','Guia de promoção de investimentos no Vietnã'],
 'VN-PREPARE-1':['Vietnam official investment guide portal','Cổng hướng dẫn đầu tư chính thức của Việt Nam','Portal oficial de orientação a investimentos no Vietnã'],
 'VN-PREPARE-2':['Basic information on Vietnam investment regulations','Thông tin cơ bản về quy định đầu tư tại Việt Nam','Informações básicas sobre normas de investimento no Vietnã'],
 'VN-PREPARE-3':['Documents needed for Vietnam investment procedures','Hồ sơ cần chuẩn bị cho thủ tục đầu tư tại Việt Nam','Documentos necessários para procedimentos de investimento no Vietnã'],
 'BR-READY-1':['Brazil business registration process','Quy trình đăng ký doanh nghiệp tại Brazil','Processo de registro empresarial no Brasil'],
 'BR-READY-2':['How to obtain a Brazilian corporate registration number (CNPJ)','Cách đăng ký mã số pháp nhân Brazil (CNPJ)','Como obter um CNPJ no Brasil'],
 'BR-READY-3':['Business operating licences and risk classification','Giấy phép hoạt động và phân loại rủi ro doanh nghiệp','Licenças de funcionamento e classificação de risco empresarial'],
 'BR-FOUNDATION-1':['Requirements for foreign companies to establish a branch or office in Brazil','Yêu cầu để công ty nước ngoài lập chi nhánh hoặc cơ sở tại Brazil','Requisitos para empresas estrangeiras estabelecerem filial ou escritório no Brasil'],
 'BR-FOUNDATION-2':['Guide to obtaining a Brazilian CNPJ for foreign legal entities','Hướng dẫn đăng ký CNPJ Brazil cho pháp nhân nước ngoài','Guia para obtenção de CNPJ brasileiro por pessoas jurídicas estrangeiras'],
 'BR-FOUNDATION-3':['Legal guide for foreign investors in Brazil','Hướng dẫn pháp lý cho nhà đầu tư nước ngoài tại Brazil','Guia jurídico para investidores estrangeiros no Brasil'],
 'BR-EXPLORE-1':['Why invest in Brazil','Vì sao đầu tư vào Brazil','Por que investir no Brasil'],
 'BR-EXPLORE-2':['Brazil investment opportunities by sector and region','Cơ hội đầu tư Brazil theo ngành và khu vực','Oportunidades de investimento no Brasil por setor e região'],
 'BR-EXPLORE-3':['Brazil federal government investment information portal','Cổng thông tin đầu tư của Chính phủ Liên bang Brazil','Portal de informações de investimento do Governo Federal do Brasil'],
 'BR-PREPARE-1':['Unified portal for Brazil business registration and legalisation','Cổng thống nhất về đăng ký và hợp pháp hóa doanh nghiệp Brazil','Portal unificado para registro e legalização de empresas no Brasil'],
 'BR-PREPARE-2':['Brazil corporate tax registration service portal','Cổng dịch vụ đăng ký thuế cho pháp nhân Brazil','Portal de serviços de registro fiscal para pessoas jurídicas no Brasil'],
 'BR-PREPARE-3':['Overview of Brazil trade and investment opportunities','Tổng quan cơ hội thương mại và đầu tư tại Brazil','Visão geral de oportunidades de comércio e investimento no Brasil']
};

const sources={
 '香港投资推广署':['Invest Hong Kong','Invest Hong Kong','Invest Hong Kong'],'香港公司注册处':['Companies Registry','Cơ quan Đăng ký Công ty','Registro de Empresas'],'香港政府一站通':['GovHK','GovHK','GovHK'],'香港特别行政区政府驻北京办事处':['Hong Kong Economic and Trade Office, Beijing','Văn phòng Kinh tế và Thương mại Hồng Kông tại Bắc Kinh','Escritório Econômico e Comercial de Hong Kong em Pequim'],
 '新加坡会计与企业管理局 ACRA':['Accounting and Corporate Regulatory Authority (ACRA)','Cơ quan Quản lý Kế toán và Doanh nghiệp Singapore (ACRA)','Autoridade Reguladora Contábil e Corporativa de Singapura (ACRA)'],'新加坡国内税务局 IRAS':['Inland Revenue Authority of Singapore (IRAS)','Cơ quan Thuế Nội địa Singapore (IRAS)','Autoridade Tributária de Singapura (IRAS)'],'新加坡经济发展局 EDB':['Singapore Economic Development Board (EDB)','Cục Phát triển Kinh tế Singapore (EDB)','Conselho de Desenvolvimento Econômico de Singapura (EDB)'],
 '美国小企业管理局 SBA':['U.S. Small Business Administration (SBA)','Cơ quan Quản lý Doanh nghiệp Nhỏ Hoa Kỳ (SBA)','Administração de Pequenas Empresas dos EUA (SBA)'],'美国国税局 IRS':['Internal Revenue Service (IRS)','Cơ quan Thuế vụ Hoa Kỳ (IRS)','Receita Federal dos EUA (IRS)'],'SelectUSA':['SelectUSA','SelectUSA','SelectUSA'],'Invest Vietnam':['Invest Vietnam','Invest Vietnam','Invest Vietnam'],
 '巴西国家企业登记与一体化司 DREI':['National Department of Business Registration and Integration (DREI)','Cục Quốc gia về Đăng ký và Tích hợp Doanh nghiệp Brazil (DREI)','Departamento Nacional de Registro Empresarial e Integração (DREI)'],'巴西企业登记一体化网络 Redesim':['Brazil Business Registration Integration Network (Redesim)','Mạng lưới Tích hợp Đăng ký Doanh nghiệp Brazil (Redesim)','Rede Nacional para a Simplificação do Registro e da Legalização de Empresas e Negócios (Redesim)'],'巴西联邦税务局 Receita Federal':['Brazil Federal Revenue Service','Cơ quan Thuế Liên bang Brazil','Receita Federal do Brasil'],'Invest & Export Brasil':['Invest & Export Brasil','Invest & Export Brasil','Invest & Export Brasil'],'巴西出口投资促进局 ApexBrasil':['ApexBrasil','ApexBrasil','ApexBrasil']
};

const indexFor=locale=>({en:0,vi:1,'pt-BR':2}[locale]);
export const guideLocaleIds=Object.keys(titles);
export function localizedGuide(guide,locale='zh-CN'){
 if(locale==='zh-CN'||locale==='zh-HK')return {title:translate(guide.title,locale),source:translate(guide.source,locale)};
 const index=indexFor(locale),fallback={en:'Official guide',vi:'Hướng dẫn chính thức','pt-BR':'Guia oficial'}[locale];
 return {title:titles[guide.id]?.[index]||fallback,source:sources[guide.source]?.[index]||fallback};
}
