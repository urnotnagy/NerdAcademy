using AutoMapper;
using NerdAcademy.API.DTOs;
using NerdAcademy.Data.Entities;

namespace NerdAcademy.API.Mapping
{
    public class EnrollmentProfile : Profile
    {
        public EnrollmentProfile()
        {
            CreateMap<EnrollmentCreateDto, Enrollment>()
                .ForMember(d => d.EnrolledAt, opt => opt.Ignore())
                .ForMember(d => d.CreatedAt, opt => opt.Ignore());

            CreateMap<Enrollment, EnrollmentReadDto>();
        }
    }
}
