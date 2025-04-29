using AutoMapper;
using NerdAcademy.API.DTOs;
using NerdAcademy.Data.Entities;

namespace NerdAcademy.API.Mapping
{

        public class TagProfile : Profile
        {
            public TagProfile()
            {
                CreateMap<TagCreateDto, Tag>();

                CreateMap<TagUpdateDto, Tag>()
                    // only map non-null values (though Name is required so it's fine)
                    .ForAllMembers(opt => opt.Condition((src, dest, srcVal) => srcVal != null));

                CreateMap<Tag, TagReadDto>();
            }
        }
    

}
