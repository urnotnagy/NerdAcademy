using AutoMapper;
using NerdAcademy.API.DTOs;
using NerdAcademy.Data.Entities;

namespace NerdAcademy.API.Mapping
{
    public class LessonProfile : Profile
    {
        public LessonProfile()
        {
            CreateMap<LessonCreateDto, Lesson>()
                .ForMember(d => d.CreatedAt, opt => opt.Ignore());

            CreateMap<Lesson, LessonReadDto>();

            CreateMap<LessonUpdateDto, Lesson>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcVal) => srcVal != null));
        }
    }

}
